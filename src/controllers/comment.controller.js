import * as commentService from '../services/comment.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getComments = async (req, res) => {
  const { imageId } = req.params;
  const comments = await commentService.getComments(parseInt(imageId, 10));
  return sendSuccess(res, 'Lấy danh sách bình luận thành công', comments);
};

export const createComment = async (req, res) => {
  const { imageId } = req.params;
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return sendError(res, 'Nội dung bình luận không được để trống', [], 400);
  }

  const comment = await commentService.createComment({
    userId: req.user.id,
    imageId: parseInt(imageId, 10),
    content: content.trim(),
  });

  return sendSuccess(res, 'Thêm bình luận thành công', comment, 201);
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const comment = await commentService.deleteComment(parseInt(id, 10), req.user.id, req.user.role === 'ADMIN');
  return sendSuccess(res, 'Đã xóa bình luận', comment);
};
