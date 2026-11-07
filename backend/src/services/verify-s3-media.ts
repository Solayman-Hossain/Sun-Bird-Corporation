import assert from 'assert';
import request from 'supertest';
import app from '../app';
import s3Client, { AWS_S3_BUCKET, AWS_REGION } from '../config/s3';
import { s3Service } from '../services/s3.service';
import { TokenService } from '../services/TokenService';
import { UserModel } from '../models/User';
import mongoose from 'mongoose';

async function runVerification() {
  console.log('--- STARTING S3 & MEDIA PRE-SIGNED URL VERIFICATION ---');

  // 1. Config Test
  console.log('1. Testing S3 client config...');
  assert(s3Client, 's3Client must be exported and instantiated');
  assert(AWS_S3_BUCKET, 'AWS_S3_BUCKET must be defined');
  assert(AWS_REGION, 'AWS_REGION must be defined');
  console.log(`   Bucket: ${AWS_S3_BUCKET}, Region: ${AWS_REGION} -> PASS`);

  // 2. Service Unit Tests
  console.log('2. Testing S3Service.generatePresignedUploadUrl...');
  
  // Valid types: image/webp, image/jpeg, image/png
  const uploadJpg = await s3Service.generatePresignedUploadUrl('sample.jpg', 'image/jpeg', 'listings');
  assert(uploadJpg.uploadUrl.includes('https://') || uploadJpg.uploadUrl.includes('http://'), 'uploadUrl should be valid URL');
  assert(uploadJpg.uploadUrl.includes('X-Amz-Signature') || uploadJpg.uploadUrl.includes('sample.jpg'), 'uploadUrl should contain signature or query params');
  assert(uploadJpg.fileUrl.includes('sample.jpg'), 'fileUrl should contain file name');
  assert(uploadJpg.fileUrl.includes('listings/'), 'fileUrl should contain folder name');
  console.log('   uploadUrl (jpeg, listings): Generated successfully -> PASS');

  const uploadPng = await s3Service.generatePresignedUploadUrl('nid-front.png', 'image/png', 'nid');
  assert(uploadPng.fileUrl.includes('nid/'), 'fileUrl should contain nid folder');
  console.log('   uploadUrl (png, nid): Generated successfully -> PASS');

  const uploadWebp = await s3Service.generatePresignedUploadUrl('selfie.webp', 'image/webp', 'selfies');
  assert(uploadWebp.fileUrl.includes('selfies/'), 'fileUrl should contain selfies folder');
  console.log('   uploadUrl (webp, selfies): Generated successfully -> PASS');

  // Test Invalid fileType validation
  console.log('3. Testing invalid fileType rejection...');
  let errorCaught = false;
  try {
    await s3Service.generatePresignedUploadUrl('document.pdf', 'application/pdf', 'listings');
  } catch (err: any) {
    errorCaught = true;
    assert(err.message.includes('Allowed types are'), 'Should reject unauthorized MIME types');
  }
  assert(errorCaught, 'Should throw ValidationError for disallowed fileType');
  console.log('   Rejected application/pdf correctly -> PASS');

  // Test Read URL
  console.log('4. Testing S3Service.generatePresignedReadUrl...');
  const readUrl = await s3Service.generatePresignedReadUrl('nid/encrypted_sample_nid.jpg');
  assert(readUrl.includes('https://') || readUrl.includes('http://'), 'readUrl should be valid URL');
  assert(readUrl.includes('encrypted_sample_nid.jpg'), 'readUrl should point to target key');
  console.log('   readUrl generated successfully -> PASS');

  // 5. HTTP Route Integration Tests
  console.log('5. Testing /api/v1/media/presigned-url authentication guard...');
  const unauthRes = await request(app)
    .post('/api/v1/media/presigned-url')
    .send({ fileName: 'test.png', fileType: 'image/png' });
  
  assert.strictEqual(unauthRes.status, 401, 'Should block unauthenticated requests with 401');
  console.log('   Blocked unauthenticated request with 401 -> PASS');

  console.log('--- ALL S3 & MEDIA PRE-SIGNED URL TESTS PASSED ---');
}

runVerification()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
