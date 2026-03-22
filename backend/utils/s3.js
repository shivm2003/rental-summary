const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

console.log('🔧 S3 Config Check:', {
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY,
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const uploadToS3 = async (fileBuffer, fileName, folder, mimetype) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error('AWS_S3_BUCKET_NAME not set in environment');
    }
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured');
    }

    const key = `${folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(fileName)}`;
    
    console.log('📤 Uploading to S3:', {
      bucket: BUCKET_NAME,
      key: key,
      mimeType: mimetype,
      size: fileBuffer.length
    });

    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype,
    };

    await s3Client.send(new PutObjectCommand(params));
    
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`.trim();
    console.log('✅ Upload successful:', url);
    return url;
    
  } catch (error) {
    console.error('❌ S3 Upload Error Details:', {
      message: error.message,
      code: error.Code || error.code,
      statusCode: error.$metadata?.httpStatusCode,
      requestId: error.$metadata?.requestId,
    });
    throw new Error('Failed to upload file to S3');
  }
};

const deleteFromS3 = async (fileUrl) => {
  try {
    if (!fileUrl) return;
    let key = fileUrl;
    if (fileUrl.includes('amazonaws.com')) {
      key = fileUrl.split('.amazonaws.com/')[1];
    }
    
    if (!key) return;
    console.log('🗑️ Deleting from S3:', key);

    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    
  } catch (error) {
    console.error('S3 Delete Error:', error.message);
  }
};

module.exports = {
  s3Client,        // ADDED: Export for pre-signed URLs
  uploadToS3,
  deleteFromS3,
  BUCKET_NAME,
};