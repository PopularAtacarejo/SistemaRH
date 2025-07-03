# 🚀 SISTEMA RH - ACESSO CONFIGURADO

## ⚡ ACESSO IMEDIATO (5 minutos)

### 1. Abrir o sistema no navegador
### 2. Pressionar **F12** (Console)
### 3. Copiar e colar este código:

```javascript
const masterUser = {
  id: '1',
  email: 'jeferson@sistemahr.com',
  name: 'Jeferson',
  role: 'Desenvolvedor',
  department: 'Desenvolvimento',
  isActive: true,
  isMaster: true,
  permissions: {
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canManageRoles: true,
    canViewAudit: true,
    canManageSystem: true,
    canAccessAllData: true
  }
};

localStorage.setItem('hrSystem_currentUser', JSON.stringify(masterUser));
localStorage.setItem('currentUser', JSON.stringify(masterUser));
sessionStorage.setItem('userLoggedIn', 'true');
window.currentUser = masterUser;

console.log('✅ ACESSO CONFIGURADO! Recarregando...');
location.reload();
```

### 4. Fazer login com:
- **📧 Email:** `jeferson@sistemahr.com`
- **🔑 Senha:** `873090As#27`

## 🎯 PRONTO!

✅ Sistema funcionando  
✅ Usuário master ativo  
✅ Todos os recursos disponíveis  

---

## 📞 Suporte: (82) 99915-8412