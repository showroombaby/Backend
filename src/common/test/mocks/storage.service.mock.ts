export const MockStorageService = {
  uploadFile: jest.fn().mockImplementation((file) => {
    return Promise.resolve(`https://test-storage.com/${file.filename}`);
  }),
  deleteFile: jest.fn().mockImplementation(() => {
    return Promise.resolve();
  }),
  getSignedUrl: jest.fn().mockImplementation((key) => {
    return Promise.resolve(`https://test-storage.com/${key}`);
  }),
};
