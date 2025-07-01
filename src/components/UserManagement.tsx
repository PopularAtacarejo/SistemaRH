import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit, Trash2, Shield, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserService, User as UserType } from '../services/userService';

interface UserManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ isOpen, onClose }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    department: ''
  });

  const roles = [
    { value: 'Administrador', label: 'Administrador', description: 'Acesso total ao sistema' },
    { value: 'Gerente RH', label: 'Gerente RH', description: 'Gerenciamento completo de candidatos' },
    { value: 'Analista RH', label: 'Analista RH', description: 'Análise e avaliação de candidatos' },
    { value: 'Assistente RH', label: 'Assistente RH', description: 'Visualização e comentários básicos' },
    { value: 'Convidado', label: 'Convidado', description: 'Apenas visualização' }
  ];

  const departments = [
    'Recursos Humanos',
    'Recrutamento',
    'Desenvolvimento',
    'Administração',
    'Diretoria'
  ];

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Carregando usuários...');
      const userData = await UserService.getAllUsers();
      setUsers(userData);
      console.log(`✅ ${userData.length} usuários carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      setError('Erro ao carregar usuários. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Email deve ter um formato válido');
      return false;
    }
    
    if (!editingUser && !formData.password.trim()) {
      setError('Senha é obrigatória para novos usuários');
      return false;
    }
    
    if (!formData.role) {
      setError('Nível de acesso é obrigatório');
      return false;
    }
    
    if (!formData.department) {
      setError('Departamento é obrigatório');
      return false;
    }

    // Verificar se email já existe (apenas para novos usuários)
    if (!editingUser) {
      const emailExists = users.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (emailExists) {
        setError('Este email já está em uso por outro usuário');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (editingUser) {
        console.log('🔄 Atualizando usuário:', formData.email);
        
        // Para edição, não incluir senha se estiver vazia
        const updateData: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          department: formData.department
        };

        if (formData.password.trim()) {
          updateData.password = formData.password;
        }

        await UserService.updateUser(editingUser.id, updateData);
        setSuccess('Usuário atualizado com sucesso!');
        setEditingUser(null);
      } else {
        console.log('🔄 Criando novo usuário:', formData.email);
        
        await UserService.createUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role,
          department: formData.department,
          password: formData.password
        });
        
        setSuccess('Usuário criado com sucesso!');
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        role: '',
        department: ''
      });
      setShowCreateForm(false);
      
      // Recarregar lista de usuários
      await loadUsers();
      
    } catch (error) {
      console.error('❌ Erro ao salvar usuário:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserType) => {
    clearMessages();
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError('Você não pode excluir sua própria conta.');
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return;

    if (confirm(`Tem certeza que deseja excluir o usuário "${userToDelete.name}"?`)) {
      setLoading(true);
      clearMessages();
      try {
        await UserService.deleteUser(userId);
        setSuccess('Usuário excluído com sucesso!');
        await loadUsers();
      } catch (error) {
        console.error('❌ Erro ao excluir usuário:', error);
        setError('Erro ao excluir usuário');
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleUserStatus = async (userId: string) => {
    if (userId === currentUser?.id) {
      setError('Você não pode desativar sua própria conta.');
      return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    setLoading(true);
    clearMessages();
    try {
      await UserService.updateUser(userId, { isActive: !user.isActive });
      setSuccess(`Usuário ${user.isActive ? 'desativado' : 'ativado'} com sucesso!`);
      await loadUsers();
    } catch (error) {
      console.error('❌ Erro ao alterar status do usuário:', error);
      setError('Erro ao alterar status do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    clearMessages();
    setShowCreateForm(true);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      department: ''
    });
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
      department: ''
    });
    clearMessages();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrador':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Gerente RH':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'Analista RH':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'Assistente RH':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Convidado':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciamento de Usuários</h2>
              <p className="text-gray-600 dark:text-gray-400">Gerencie usuários e permissões do sistema</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleNewUser}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              Novo Usuário
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">{success}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex h-full max-h-[calc(90vh-80px)]">
          {/* User List */}
          <div className="flex-1 p-6 overflow-y-auto">
            {loading && !showCreateForm ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando usuários...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div
                      key={user.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        user.isActive 
                          ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700' 
                          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                              {user.id === currentUser?.id && (
                                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                                  Você
                                </span>
                              )}
                              {!user.isActive && (
                                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded-full">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {user.department}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            disabled={loading}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors disabled:opacity-50"
                            title="Editar usuário"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {user.id !== currentUser?.id && (
                            <>
                              <button
                                onClick={() => toggleUserStatus(user.id)}
                                disabled={loading}
                                className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                  user.isActive
                                    ? 'text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/50'
                                    : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50'
                                }`}
                                title={user.isActive ? 'Desativar usuário' : 'Ativar usuário'}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => handleDelete(user.id)}
                                disabled={loading}
                                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Create/Edit Form */}
          {showCreateForm && (
            <div className="w-96 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {editingUser ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Nome do usuário"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="email@empresa.com"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Senha {editingUser ? '(deixe em branco para manter)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Senha do usuário"
                      required={!editingUser}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={loading}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nível de Acesso *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={loading}
                  >
                    <option value="">Selecione o nível</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  {formData.role && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {roles.find(r => r.value === formData.role)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Departamento *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    disabled={loading}
                  >
                    <option value="">Selecione o departamento</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 dark:bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    {editingUser ? 'Atualizar' : 'Criar Usuário'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;