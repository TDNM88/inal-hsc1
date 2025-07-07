function CustomersPage({ token }: any) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    password: '',
    balance: 0,
    frozenBalance: 0,
    fullName: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  // Dữ liệu mock với các tên bạn cung cấp
  const mockUsers = [
    { _id: '1', username: 'amen123', fullName: 'Amen 123', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.1', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '2', username: 'tramanh2025', fullName: 'Tra Manh 2025', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.2', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '3', username: 'phattai68', fullName: 'Phat Tai 68', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.3', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '4', username: 'okbaby', fullName: 'Ok Baby', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.4', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '5', username: 'mami123', fullName: 'Mami 123', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.5', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '6', username: 'choichochan', fullName: 'Choi Cho Chan', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.6', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '7', username: 'Nguyen Van A', fullName: 'Nguyen Van A', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.7', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '8', username: 'admin', fullName: 'Admin User', role: 'admin', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.8', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '9', username: 'user1', fullName: 'User One', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.9', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '10', username: 'tdnm', fullName: 'TDNM', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.10', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '11', username: 'abc1234', fullName: 'ABC 1234', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.11', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '12', username: 'vancong1052002', fullName: 'Van Cong 1052002', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.12', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '13', username: 'bolaoi23', fullName: 'Bolao I23', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.13', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
    { _id: '14', username: 'choichochan', fullName: 'Choi Cho Chan', role: 'user', balance: { available: 0, frozen: 0 }, loginInfo: '192.168.1.14', verification: { cccdFront: false, cccdBack: false, verified: false }, status: { active: true, betLocked: false, withdrawLocked: false }, bank: { name: '', accountNumber: '', accountHolder: '' } },
  ];

  // Lọc người dùng dựa trên searchTerm và statusFilter
  const filteredUsers = mockUsers.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.status.active) || 
      (statusFilter === 'inactive' && !user.status.active);
    return matchesSearch && matchesStatus;
  });

  const { data, isLoading, mutate } = useSWR(
    token ? `/api/admin/users?search=${searchTerm}&status=${statusFilter}` : null,
    () => ({ users: filteredUsers }), // Sử dụng dữ liệu mock thay vì fetch
    { refreshInterval: 5000 }
  );

  const customers = data?.users || [];

  const toggleCustomerStatus = async (customerId: string, field: string, currentValue: boolean) => {
    const updatedUsers = mockUsers.map((user) =>
      user._id === customerId
        ? { ...user, status: { ...user.status, [field]: !currentValue } }
        : user
    );
    toast({ title: 'Thành công', description: `Đã cập nhật trạng thái ${field}` });
    mutate({ users: updatedUsers }, false);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setEditForm({
      username: customer.username,
      password: '',
      balance: customer.balance.available,
      frozenBalance: customer.balance.frozen,
      fullName: customer.fullName,
      bankName: customer.bank?.name || '',
      accountNumber: customer.bank?.accountNumber || '',
      accountHolder: customer.bank?.accountHolder || '',
    });
    setShowEditModal(true);
  };

  const handleSaveCustomer = async () => {
    const updatedUsers = mockUsers.map((user) =>
      user._id === editingCustomer._id
        ? {
            ...user,
            username: editForm.username,
            fullName: editForm.fullName,
            balance: { available: editForm.balance, frozen: editForm.frozenBalance },
            bank: {
              name: editForm.bankName,
              accountNumber: editForm.accountNumber,
              accountHolder: editForm.accountHolder,
            },
          }
        : user
    );
    toast({ title: 'Thành công', description: 'Đã cập nhật thông tin khách hàng' });
    mutate({ users: updatedUsers }, false);
    setShowEditModal(false);
    setEditingCustomer(null);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) {
      const updatedUsers = mockUsers.filter((user) => user._id !== customerId);
      toast({ title: 'Thành công', description: 'Đã xóa khách hàng' });
      mutate({ users: updatedUsers }, false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Khách hàng</span>
      </div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label>Tìm kiếm</Label>
          <Input
            placeholder="Tìm theo username, ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Không hoạt động</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm">Đặt lại</Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">Áp dụng</Button>
      </div>
      <div className="flex justify-end mb-4">
        <Button className="bg-green-600 hover:bg-green-700">+ Thêm tài khoản</Button>
      </div>
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Danh sách khách hàng</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Tên đăng nhập</TableHead>
                  <TableHead className="text-white">Số dư</TableHead>
                  <TableHead className="text-white">Ip login</TableHead>
                  <TableHead className="text-white">Thông tin xác minh</TableHead>
                  <TableHead className="text-white">Trạng thái</TableHead>
                  <TableHead className="text-white">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow key={customer._id}>
                    <TableCell className="text-teal-400 font-medium">{customer.username}</TableCell>
                    <TableCell>
                      <div className="text-sm text-white">
                        <div>Số dư: <span className="font-semibold">{customer.balance.available.toLocaleString()}</span></div>
                        <div>Số dư đông băng: <span className="font-semibold">{customer.balance.frozen.toLocaleString()}</span></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">{customer.loginInfo}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-white">
                        <div>{customer.fullName}</div>
                        <div>CCCD mặt trước: {customer.verification?.cccdFront ? 'Có' : 'Không'}</div>
                        <div>CCCD mặt sau: {customer.verification?.cccdBack ? 'Có' : 'Không'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>Trạng thái:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'active', customer.status.active)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.active ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {customer.status.active ? 'Hoạt động' : 'Không hoạt động'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Xác minh:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'verified', customer.verification.verified)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.verification.verified ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.verification.verified ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.verification.verified ? 'text-green-600' : 'text-gray-500'}`}>
                            {customer.verification.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Khóa cược:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'betLocked', customer.status.betLocked)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.betLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.betLocked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.betLocked ? 'text-red-600' : 'text-gray-500'}`}>
                            {customer.status.betLocked ? 'Có' : 'Không'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Khóa rút:</span>
                          <button
                            onClick={() => toggleCustomerStatus(customer._id, 'withdrawLocked', customer.status.withdrawLocked)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${customer.status.withdrawLocked ? 'bg-red-500' : 'bg-gray-300'}`}
                          >
                            <div className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${customer.status.withdrawLocked ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </button>
                          <span className={`ml-2 text-xs ${customer.status.withdrawLocked ? 'text-red-600' : 'text-gray-500'}`}>
                            {customer.status.withdrawLocked ? 'Có' : 'Không'}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="p-1 bg-transparent hover:bg-blue-800" onClick={() => handleEditCustomer(customer)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button size="sm" variant="outline" className="p-1 bg-transparent hover:bg-red-800" onClick={() => handleDeleteCustomer(customer._id)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Update thông tin</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tên đăng nhập</Label>
                <Input value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} className="bg-gray-700 text-white" />
              </div>
              <div>
                <Label>Mật khẩu</Label>
                <Input
                  type="password"
                  placeholder="Mật khẩu"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="bg-gray-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Số dư</Label>
                <Input
                  type="number"
                  value={editForm.balance}
                  onChange={(e) => setEditForm({ ...editForm, balance: Number(e.target.value) })}
                  className="bg-gray-700 text-white"
                />
              </div>
              <div>
                <Label>Số dư đông băng</Label>
                <Input
                  type="number"
                  value={editForm.frozenBalance}
                  onChange={(e) => setEditForm({ ...editForm, frozenBalance: Number(e.target.value) })}
                  className="bg-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-center mb-4">Thông tin xác minh danh tính</h3>
              <div className="mb-4">
                <Label>Họ tên</Label>
                <Input
                  placeholder="Họ tên"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="bg-gray-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CCCD mặt trước</Label>
                  <Button variant="outline" className="w-full mt-2 bg-transparent text-white border-gray-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </Button>
                </div>
                <div>
                  <Label>CCCD mặt sau</Label>
                  <Button variant="outline" className="w-full mt-2 bg-transparent text-white border-gray-600">
                    <Upload className="h-4 w-4 mr-2" />
                    Tải lên
                  </Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-center mb-4">Thông tin ngân hàng</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Tên ngân hàng</Label>
                  <Input
                    placeholder="Tên ngân hàng"
                    value={editForm.bankName}
                    onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label>Số tài khoản</Label>
                  <Input
                    placeholder="Số tài khoản"
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
                <div>
                  <Label>Chủ tài khoản</Label>
                  <Input
                    placeholder="Chủ tài khoản"
                    value={editForm.accountHolder}
                    onChange={(e) => setEditForm({ ...editForm, accountHolder: e.target.value })}
                    className="bg-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowEditModal(false)} className="text-white border-gray-600">Đóng</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSaveCustomer}>Lưu</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
