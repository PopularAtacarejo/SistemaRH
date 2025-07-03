export interface Comment {
  id: string;
  text: string;
  author: string;
  date: string;
  type: 'comment' | 'status_change';
  editedAt?: string;
  editedBy?: string;
}

export interface Reminder {
  id: string;
  type: 'automatic' | 'manual';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface Candidate {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  cidade: string;
  bairro: string;
  vaga: string;
  data: string;
  arquivo: string;
  email?: string;
  phone?: string;
  city?: string;
  position?: string;
  name?: string;
  status: string;
  applicationDate?: string;
  lastUpdate?: string;
  updatedBy?: string;
  resumeUrl?: string;
  experience?: string;
  comments?: Comment[];
  startDate?: string | null;
  notes?: string;
  reminders?: Reminder[];
}