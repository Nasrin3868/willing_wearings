const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");

const verifyPassword = async (inputPassword, hashedPassword) => {
  return await bcrypt.compare(inputPassword, hashedPassword);
};

const sendOTP = (email) => {
  const generatedOTP = randomstring.generate({
    length: 6,
    charset: "numeric",
  });

  generatedOTP = generatedOTP;
  console.log("Generated OTP:", generatedOTP);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
      user: process.env.nodemailer_email,
      pass: process.env.nodemailer_password,
    },
  });

  const mailOptions = {
    from: process.env.nodemailer_email,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${generatedOTP}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending OTP:", error);
    } else {
      console.log("OTP sent:", info.response);
    }
  });

  // Expire OTP after 1 minute
  setTimeout(() => {
    generatedOTP = null;
  }, 60 * 1000);
};

const handleReferral = async (referralCode) => {
    if (!referralCode) return { wallet: 0, referralApplied: false };
  
    const user = await collection.findOne({ referral_code: referralCode });
    const referral = await ReferralCollection.findOne();
  
    if (user && referral) {
      await collection.findOneAndUpdate(
        { referral_code: referralCode },
        { $inc: { wallet: referral.referee, referral_count: 1 } }
      );
      return { wallet: referral.referee, referralApplied: true };
    }
    
    return { wallet: 0, referralApplied: false };
  };

  const hashPassword = async (password) => {
    const saltRounds = 10;
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
        if (err) reject("Error hashing password");
        resolve(hashedPassword);
      });
    });
  };

//   const registerUser = async (userData) => {
//     const newUser = new collection(userData);
//     await newUser.save();
//   };

module.exports = {
  verifyPassword,
  sendOTP,
  handleReferral,
  hashPassword,
    // registerUser,

};
