import fs from 'fs';
import path from 'path';

export const storage = {
  async upload(bucket: string, filePath: string, file: File | Blob | Buffer) {
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket);
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Handle file path (remove leading slashes)
      const cleanPath = filePath.replace(/^\/+/, '');
      const fullPath = path.join(uploadDir, cleanPath);
      
      // Ensure subdirectories exist
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let buffer: Buffer;
      if (Buffer.isBuffer(file)) {
        buffer = file;
      } else if (file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      } else {
        throw new Error('Unsupported file type');
      }

      fs.writeFileSync(fullPath, buffer);

      return {
        data: { path: cleanPath },
        error: null
      };
    } catch (error: any) {
      console.error('Storage upload error:', error);
      return { data: null, error };
    }
  },

  getPublicUrl(bucket: string, filePath: string) {
    const cleanPath = filePath.replace(/^\/+/, '');
    return {
      data: {
        publicUrl: `/uploads/${bucket}/${cleanPath}`
      }
    };
  },
  
  async remove(bucket: string, filePaths: string[]) {
      try {
          const uploadDir = path.join(process.cwd(), 'public', 'uploads', bucket);
          
          for (const filePath of filePaths) {
              const cleanPath = filePath.replace(/^\/+/, '');
              const fullPath = path.join(uploadDir, cleanPath);
              
              if (fs.existsSync(fullPath)) {
                  fs.unlinkSync(fullPath);
              }
          }
          return { data: {}, error: null };
      } catch (error) {
          return { data: null, error };
      }
  }
};
