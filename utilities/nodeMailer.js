const nodemailer= require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nepathyalibrary@gmail.com',
      pass: 'gsnrtveeyhioeaep'
    }
  });
  module.exports=transporter;