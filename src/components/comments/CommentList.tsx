'use client';

import { useState, useEffect, useCallback } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import { MessageCircle } from 'lucide-react';
import type { ThreadedComment } from '@/types/comments';

interface CommentListProps {
  storyId: string;
  currentUser: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
  initialComments?: ThreadedComment[];
  initialTotal?: number;
}

export default function CommentList({
  storyId,
  currentUser,
  initialComments,
  initialTotal,
}: CommentListProps) {
  const [comments, setComments] = useState<ThreadedComment[]>(initialComments || []);
  const [total, setTotal] = useState(initialTotal || 0);
  const [isLoading, setIsLoading] = useState(!initialComments);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch comments if not provided
  useEffect(() => {
    if (!initialComments) {
      fetchComments();
    }
  }, [storyId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stories/${storyId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = useCallback(async (content: string, parentId: string | null) => {
    const response = await fetch(`/api/stories/${storyId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        parent_id: parentId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to post comment');
    }

    const data = await response.json();
    const newComment = data.comment as ThreadedComment;

    if (parentId) {
      // Add reply to parent
      setComments(prev => addReplyToComment(prev, parentId, newComment));
      setReplyingTo(null);
    } else {
      // Add new root comment
      setComments(prev => [...prev, newComment]);
    }
    setTotal(prev => prev + 1);
  }, [storyId]);

  const handleEditComment = useCallback(async (commentId: string, newContent: string) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });

    if (!response.ok) {
      throw new Error('Failed to edit comment');
    }

    const data = await response.json();
    setComments(prev => updateCommentInTree(prev, commentId, data.comment));
  }, []);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    const response = await fetch(`/api/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    setComments(prev => removeCommentFromTree(prev, commentId));
    setTotal(prev => prev - 1);
  }, []);

  const handleReply = useCallback((parentId: string) => {
    setReplyingTo(parentId);
  }, []);

  if (isLoading) {
    return (
      <div className="py-4 text-center text-gray-500 text-sm">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-600">
        <MessageCircle className="w-4 h-4" />
        <span className="text-sm font-medium">
          {total} {total === 1 ? 'Comment' : 'Comments'}
        </span>
      </div>

      {/* Comment form */}
      <CommentForm
        currentUser={currentUser}
        onSubmit={handleSubmitComment}
      />

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4 mt-4">
          {comments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUser.id}
                onReply={handleReply}
                onEdit={handleEditComment}
                onDelete={handleDeleteComment}
              />

              {/* Reply form */}
              {replyingTo === comment.id && (
                <div className="ml-11 mt-2">
                  <CommentForm
                    parentId={comment.id}
                    currentUser={currentUser}
                    onSubmit={handleSubmitComment}
                    onCancel={() => setReplyingTo(null)}
                    placeholder={`Reply to ${comment.author.first_name}...`}
                    autoFocus
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

// Helper functions for tree manipulation
function addReplyToComment(
  comments: ThreadedComment[],
  parentId: string,
  reply: ThreadedComment
): ThreadedComment[] {
  return comments.map(comment => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, reply],
        replyCount: comment.replyCount + 1,
      };
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: addReplyToComment(comment.replies as ThreadedComment[], parentId, reply),
      };
    }
    return comment;
  });
}

function updateCommentInTree(
  comments: ThreadedComment[],
  commentId: string,
  updatedComment: Partial<ThreadedComment>
): ThreadedComment[] {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return { ...comment, ...updatedComment };
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInTree(comment.replies as ThreadedComment[], commentId, updatedComment),
      };
    }
    return comment;
  });
}

function removeCommentFromTree(
  comments: ThreadedComment[],
  commentId: string
): ThreadedComment[] {
  return comments
    .filter(comment => comment.id !== commentId)
    .map(comment => ({
      ...comment,
      replies: removeCommentFromTree(comment.replies as ThreadedComment[], commentId),
    }));
}
