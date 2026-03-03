type Role = 'ADMIN' | 'USER' | 'PUBLIC';

interface TokenPayload {
  id: ObjectId;
  type: Role;
  iat: number;
  exp: number;
}

interface Pagination {
  limit: number;
  offset: number;
  page: number;
  size: number;
}

interface Permission {
  name: string;
  description: string;
}

type TPgEnum = [string, ...string[]];

type TOrigin = 'android' | 'ios' | 'web';
