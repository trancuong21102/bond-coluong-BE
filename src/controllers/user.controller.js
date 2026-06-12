import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/response.js';

export const getUserProfile = async (req, res) => {
  const { id } = req.params;
  const user = await userService.getUserProfile(parseInt(id, 10));
  return sendSuccess(res, 'Lấy thông tin người dùng thành công', user);
};

export const followUser = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.id, 10);
  
  await userService.followUser(currentUserId, targetUserId);
  return sendSuccess(res, 'Đã theo dõi người dùng', null);
};

export const unfollowUser = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.id, 10);
  
  await userService.unfollowUser(currentUserId, targetUserId);
  return sendSuccess(res, 'Đã bỏ theo dõi người dùng', null);
};

export const getFollowStatus = async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.id, 10);
  
  const isFollowing = await userService.getFollowStatus(currentUserId, targetUserId);
  return sendSuccess(res, 'Lấy trạng thái theo dõi thành công', { isFollowing });
};
