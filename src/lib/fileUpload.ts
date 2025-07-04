/**
 * Mock utility để giả lập việc upload file
 * Trong môi trường thực, điều này sẽ sử dụng S3, Firebase Storage hoặc các dịch vụ lưu trữ khác
 */
export async function uploadFile(file: File): Promise<string> {
  // Giả lập quá trình upload
  return new Promise((resolve) => {
    setTimeout(() => {
      // Trả về URL giả
      resolve(`https://fake-storage.example.com/uploads/${Date.now()}-${file.name}`);
    }, 500); // Giả lập delay 500ms
  });
}
