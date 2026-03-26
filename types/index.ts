// ==================== Article Types ====================

export type PostType = 'NEWS' | 'ARTICLE' | 'REVIEW' | 'STORY'
export type ContentStatus = 'DRAFT' | 'PUBLISHED'

export interface Author {
  id: number
  strapiId: number | null
  name: string
  slug: string
  email: string | null
  bio: string | null
  avatar: string | null
  label: string | null
  viewCount: number
  createdAt: Date
  updatedAt: Date
  _count?: {
    articles: number
  }
}

export interface Article {
  id: number
  strapiId: number | null
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image: string | null
  imageCaption: string | null
  postType: PostType
  status: ContentStatus
  publishedAt: Date | null
  modifiedAt: Date | null
  authorId: number | null
  author: Author | null
  categoryId: number | null
  category: Category | null
  tags: ArticleTag[]
  comments: Comment[]
  viewCount: number
  readingTime: number | null
  wordCount: number | null
  metaTitle: string | null
  metaDesc: string | null
  canonicalUrl: string | null
  focusKeyword: string | null
  featured: boolean
  points: ReviewPoints | null
  faq: FaqItem[] | null
  brands: number[] | null
  oldUrl: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ReviewPoints {
  positive: string[]
  negative: string[]
  paragraph?: number
}

export interface FaqItem {
  question: string
  answer: string
}

// ==================== Category & Tag Types ====================

export interface Category {
  id: number
  strapiId: number | null
  name: string
  slug: string
  description: string | null
  image: string | null
  parentId: number | null
  parent: Category | null
  children: Category[]
  order: number
  seoTitle: string | null
  seoContent: string | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    articles: number
  }
}

export interface Tag {
  id: number
  strapiId: number | null
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  _count?: {
    articles: number
  }
}

export interface ArticleTag {
  articleId: number
  tagId: number
  tag: Tag
}

// ==================== Comment Types ====================

export interface Comment {
  id: number
  strapiId: number | null
  articleId: number
  article?: Article
  parentId: number | null
  parent?: Comment | null
  replies?: Comment[]
  authorName: string
  authorEmail: string | null
  content: string
  isApproved: boolean
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Story Types ====================

export interface StoryItem {
  type: 'image' | 'video'
  url: string
  caption?: string
  link?: string
  productId?: number
}

export interface Story {
  id: number
  title: string
  cover: string | null
  items: StoryItem[] | null
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ==================== Other Types ====================

export interface Setting {
  id: string
  key: string
  value: string
  createdAt: Date
  updatedAt: Date
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  isRead: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Ad {
  id: number
  zone: string
  title: string | null
  content: string | null
  imageUrl: string | null
  linkUrl: string | null
  isActive: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// ==================== Form Types ====================

export interface CommentFormData {
  authorName: string
  authorEmail?: string
  content: string
  articleId: number
  parentId?: number
}

export interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
}

// ==================== Pagination ====================

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// ==================== Search ====================

export interface SearchResult {
  articles: Article[]
  total: number
}
