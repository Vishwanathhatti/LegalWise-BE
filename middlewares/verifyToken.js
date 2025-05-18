import jwt from 'jsonwebtoken';
import userModel from '../models/user.model.js';
import redisClient from '../utils/redis.js'; // Make sure this points to your Redis setup
import 'dotenv/config';

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({
      message: 'Unauthorized: No token provided.',
      success: false,
    });
  }


  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const userId = decoded.userId;
    const deviceId = decoded.deviceId; // Extract deviceId from the token
    // Check Redis session by user._id
    const redisKey = `session:${userId}:${deviceId}`; // Replace deviceId with actual device ID if needed
    const storedToken = await redisClient.get(redisKey);

    if (!storedToken || storedToken !== token) {
      return res.status(401).json({
        message: 'Unauthorized: Session invalid or expired.',
        success: false,
      });
    }

    // Optionally refresh TTL (1 day = 86400 seconds)
    await redisClient.expire(redisKey, 86400);

    const user = await userModel.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({
        message: 'User not found.',
        success: false,
      });
    }

    req.user = user;
    req.id = userId;
    req.deviceId = deviceId; // Attach deviceId to the request object
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized: Invalid or expired token.',
      success: false,
    });
  }
};
