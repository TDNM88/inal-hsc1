// pages/api/admin/customers.ts (or app/api/admin/customers/route.ts for App Router)

import { NextApiRequest, NextApiResponse } from 'next';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { getToken } from 'next-auth/jwt'; // Assuming you're using NextAuth for authentication

// Define the Customer interface for TypeScript
interface Customer extends Document {
  _id: string;
  username: string;
  fullName?: string;
  email: string;
  phone?: string;
  balance: {
    available: number;
    frozen: number;
  };
  status: 'active' | 'inactive' | 'banned';
  role?: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginIp?: string;
  verification?: {
    status: 'pending' | 'verified' | 'rejected';
    cccdFront?: string;
    cccdBack?: string;
  };
  bank?: {
    name: string;
    accountNumber: string;
    accountHolder: string;
  };
}

// Mongoose Schema for Customer
const customerSchema = new Schema<Customer>({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: false },
  balance: {
    available: { type: Number, required: true, default: 0 },
    frozen: { type: Number, required: true, default: 0 },
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned'],
    required: true,
    default: 'active',
  },
  role: { type: String, required: false },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() },
  updatedAt: { type: String, required: false },
  lastLoginIp: { type: String, required: false },
  verification: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      required: false,
    },
    cccdFront: { type: String, required: false },
    cccdBack: { type: String, required: false },
  },
  bank: {
    name: { type: String, required: false },
    accountNumber: { type: String, required: false },
    accountHolder: { type: String, required: false },
  },
});

// Mongoose Model
const CustomerModel: Model<Customer> =
  mongoose.models.Customer || mongoose.model<Customer>('Customer', customerSchema);

// MongoDB connection function
async function connectToDatabase() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as any);
  }
}

// API Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to the database
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Không thể kết nối đến cơ sở dữ liệu' });
  }

  // Verify authentication (assuming JWT-based authentication with NextAuth)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || token.role !== 'admin') {
    return res.status(401).json({ error: 'Không có quyền truy cập' });
  }

  const { method } = req;

  switch (method) {
    case 'GET':
      try {
        const customers = await CustomerModel.find({}).lean();
        return res.status(200).json(customers);
      } catch (error) {
        console.error('Error fetching customers:', error);
        return res.status(500).json({ error: 'Không thể tải danh sách khách hàng' });
      }

    case 'POST':
      try {
        const {
          username,
          email,
          fullName,
          phone,
          balance,
          status,
          role,
          verification,
          bank,
        } = req.body;

        // Validate required fields
        if (!username || !email) {
          return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: username và email' });
        }

        const newCustomer = new CustomerModel({
          username,
          email,
          fullName,
          phone,
          balance: balance || { available: 0, frozen: 0 },
          status: status || 'active',
          role,
          createdAt: new Date().toISOString(),
          verification,
          bank,
        });

        await newCustomer.save();
        return res.status(201).json(newCustomer);
      } catch (error) {
        console.error('Error creating customer:', error);
        return res.status(500).json({ error: 'Không thể tạo khách hàng' });
      }

    case 'PUT':
      try {
        const { userId, field, value } = req.body;

        if (!userId || !field) {
          return res.status(400).json({ error: 'Thiếu userId hoặc field' });
        }

        const update: any = {};
        if (field.includes('.')) {
          // Handle nested fields like balance.available or bank.name
          const [parent, child] = field.split('.');
          update[parent] = { [child]: value };
        } else {
          update[field] = value;
        }

        const updatedCustomer = await CustomerModel.findByIdAndUpdate(
          userId,
          { $set: update, updatedAt: new Date().toISOString() },
          { new: true }
        );

        if (!updatedCustomer) {
          return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        return res.status(200).json(updatedCustomer);
      } catch (error) {
        console.error('Error updating customer:', error);
        return res.status(500).json({ error: 'Không thể cập nhật thông tin khách hàng' });
      }

    case 'DELETE':
      try {
        const { customerId } = req.query;

        if (!customerId || typeof customerId !== 'string') {
          return res.status(400).json({ error: 'Thiếu hoặc sai định dạng customerId' });
        }

        const deletedCustomer = await CustomerModel.findByIdAndDelete(customerId);

        if (!deletedCustomer) {
          return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        return res.status(200).json({ message: 'Xóa khách hàng thành công' });
      } catch (error) {
        console.error('Error deleting customer:', error);
        return res.status(500).json({ error: 'Không thể xóa khách hàng' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Phương thức ${method} không được phép` });
  }
}
