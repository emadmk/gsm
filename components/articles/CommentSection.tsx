'use client'

import { useState, FormEvent } from 'react'
import Image from 'next/image'
import { User, Shield, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { cn, timeAgo, toPersianDigits } from '@/lib/utils'

export interface Comment {
  id: number | string
  author: string
  email?: string
  avatar?: string | null
  content: string
  isAdmin?: boolean
  createdAt: string | Date
  replies?: Comment[]
}

interface CommentSectionProps {
  postId: number | string
  comments: Comment[]
  totalComments?: number
  onSubmit?: (data: { name: string; email: string; content: string; parentId?: number | string }) => Promise<void>
  className?: string
}

interface CommentFormProps {
  onSubmit: (data: { name: string; email: string; content: string }) => Promise<void>
  parentId?: number | string
  onCancel?: () => void
  isReply?: boolean
}

function CommentForm({ onSubmit, onCancel, isReply = false }: CommentFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'نام الزامی است'
    if (!email.trim()) newErrors.email = 'ایمیل الزامی است'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'ایمیل نامعتبر است'
    if (!content.trim()) newErrors.content = 'متن دیدگاه الزامی است'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), content: content.trim() })
      setName('')
      setEmail('')
      setContent('')
      setErrors({})
    } catch {
      setErrors({ form: 'خطایی رخ داد. لطفا دوباره تلاش کنید.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
      {!isReply && (
        <h3 className="h4 text-gray-900">دیدگاه خود را بنویسید</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="نام"
          placeholder="نام شما"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />
        <Input
          label="ایمیل"
          type="email"
          placeholder="ایمیل شما"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          dir="ltr"
          className="text-left"
        />
      </div>

      <Textarea
        label="دیدگاه"
        placeholder="دیدگاه خود را بنویسید..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        error={errors.content}
        required
      />

      {errors.form && (
        <p className="caption text-red-500">{errors.form}</p>
      )}

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isSubmitting}
          icon={<Send className="w-4 h-4" />}
          iconPosition="right"
        >
          ارسال دیدگاه
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
          >
            انصراف
          </Button>
        )}
      </div>
    </form>
  )
}

interface CommentItemProps {
  comment: Comment
  onReply?: (data: { name: string; email: string; content: string }, parentId: number | string) => Promise<void>
  depth?: number
}

function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [showReplies, setShowReplies] = useState(true)
  const hasReplies = comment.replies && comment.replies.length > 0
  const maxDepth = 3

  const handleReplySubmit = async (data: { name: string; email: string; content: string }) => {
    if (onReply) {
      await onReply(data, comment.id)
      setShowReplyForm(false)
    }
  }

  return (
    <div
      className={cn(
        'relative',
        depth > 0 && 'mr-6 md:mr-10 border-r-2 border-gray-100 pr-4'
      )}
    >
      <div className="py-4">
        {/* Comment Header */}
        <div className="flex items-center gap-3 mb-2">
          {comment.avatar ? (
            <Image
              src={comment.avatar}
              alt={comment.author}
              width={36}
              height={36}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="size-9 rounded-full bg-gray-200 flex-center flex-shrink-0">
              <User className="w-4 h-4 text-gray-400" />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="subtitle-sm text-gray-900">{comment.author}</span>
            {comment.isAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-500/[0.08] text-primary-500 rounded-full text-xs font-medium">
                <Shield className="w-3 h-3" />
                مدیر
              </span>
            )}
            <span className="caption text-gray-400">
              {timeAgo(comment.createdAt)}
            </span>
          </div>
        </div>

        {/* Comment Body */}
        <p className="body-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3">
          {depth < maxDepth && onReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="inline-flex items-center gap-1.5 caption text-gray-500 hover:text-primary-500 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              پاسخ
            </button>
          )}

          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="inline-flex items-center gap-1 caption text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showReplies ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  مخفی کردن پاسخ‌ها
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  {toPersianDigits(comment.replies!.length)} پاسخ
                </>
              )}
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <CommentForm
              onSubmit={handleReplySubmit}
              parentId={comment.id}
              onCancel={() => setShowReplyForm(false)}
              isReply
            />
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {hasReplies && showReplies && (
        <div>
          {comment.replies!.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function CommentSection({
  comments,
  totalComments,
  onSubmit,
  className,
}: CommentSectionProps) {
  const commentCount = totalComments ?? comments.length

  const handleSubmit = async (data: { name: string; email: string; content: string }) => {
    if (onSubmit) {
      await onSubmit(data)
    }
  }

  const handleReply = async (
    data: { name: string; email: string; content: string },
    parentId: number | string
  ) => {
    if (onSubmit) {
      await onSubmit({ ...data, parentId })
    }
  }

  return (
    <section className={cn('mt-8', className)} dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-primary-500" />
        <h2 className="h3 text-gray-900">
          دیدگاه‌ها
          {commentCount > 0 && (
            <span className="text-gray-400 mr-2">
              ({toPersianDigits(commentCount)})
            </span>
          )}
        </h2>
      </div>

      {/* Comment Form */}
      {onSubmit && (
        <div className="bg-white rounded-lg shadow-post-box p-6 mb-6">
          <CommentForm onSubmit={handleSubmit} />
        </div>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="bg-white rounded-lg shadow-post-box divide-y divide-gray-100">
          <div className="px-6">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={onSubmit ? handleReply : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-post-box p-8 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="body-sm text-gray-500">هنوز دیدگاهی ثبت نشده. اولین نفر باشید!</p>
        </div>
      )}
    </section>
  )
}
