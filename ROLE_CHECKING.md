# Role-Based Access Control (RBAC) System

Sistem role checking yang bisa dipake di mana-mana untuk mengontrol akses user berdasarkan role mereka.

## 🚀 Fitur Utama

- ✅ Check role admin dengan mudah
- ✅ Check role spesifik (single atau multiple)
- ✅ Conditional rendering berdasarkan role
- ✅ Custom hook untuk role management
- ✅ Component wrapper untuk role-based access control

## 📦 Komponen yang Tersedia

### 1. Utility Functions (`src/lib/utils.js`)

```javascript
import { isAdmin, hasRole, getCurrentUserRole } from '@/lib/utils';

// Check if user is admin
const isUserAdmin = isAdmin();

// Check if user has specific role(s)
const canEdit = hasRole(['admin', 'manager']);
const canDelete = hasRole('admin');

// Get current user role
const userRole = getCurrentUserRole();
```

### 2. Custom Hook (`src/hooks/useRole.js`)

```javascript
import { useRole } from '@/hooks/useRole';

function MyComponent() {
  const { 
    userRole,           // Current user role
    isUserAdmin,        // Boolean: is user admin?
    checkIsAdmin,       // Function to check admin status
    checkHasRole,       // Function to check specific role
    getRole,           // Function to get current role
    refreshRole,       // Function to refresh role data
    isAdmin,           // Alias for checkIsAdmin
    hasRole            // Alias for checkHasRole
  } = useRole();

  return (
    <div>
      {isUserAdmin && <AdminPanel />}
      {hasRole(['manager', 'supervisor']) && <ManagerTools />}
    </div>
  );
}
```

### 3. RoleGuard Component (`src/components/RoleGuard.jsx`)

```javascript
import RoleGuard from '@/components/RoleGuard';

// Basic usage - admin only
<RoleGuard adminOnly>
  <DeleteButton />
</RoleGuard>

// Specific roles
<RoleGuard roles={['admin', 'manager']}>
  <EditButton />
</RoleGuard>

// With fallback content
<RoleGuard 
  roles={['admin']} 
  fallback={<p>You don't have permission to view this content</p>}
>
  <AdminContent />
</RoleGuard>

// Hide completely if no access
<RoleGuard roles={['admin']} hide>
  <SecretContent />
</RoleGuard>
```

## 🎯 Contoh Penggunaan

### 1. Conditional Rendering dengan Hook

```javascript
import { useRole } from '@/hooks/useRole';

function SalesOrderPage() {
  const { isUserAdmin, hasRole } = useRole();

  return (
    <div>
      {/* Auto Fill button hanya untuk admin */}
      {isUserAdmin && (
        <Button onClick={handleAutoFill}>
          🎲 Auto Fill
        </Button>
      )}

      {/* Print button untuk admin, manager, supervisor */}
      {hasRole(['admin', 'manager', 'supervisor']) && (
        <Button onClick={handlePrint}>
          Print SO
        </Button>
      )}

      {/* Delete button hanya untuk admin */}
      {isUserAdmin && (
        <Button onClick={handleDelete} variant="destructive">
          Delete SO
        </Button>
      )}
    </div>
  );
}
```

### 2. Conditional Rendering dengan RoleGuard

```javascript
import RoleGuard from '@/components/RoleGuard';

function SalesOrderPage() {
  return (
    <div>
      {/* Auto Fill button hanya untuk admin */}
      <RoleGuard adminOnly>
        <Button onClick={handleAutoFill}>
          🎲 Auto Fill
        </Button>
      </RoleGuard>

      {/* Print button untuk admin, manager, supervisor */}
      <RoleGuard roles={['admin', 'manager', 'supervisor']}>
        <Button onClick={handlePrint}>
          Print SO
        </Button>
      </RoleGuard>

      {/* Delete button hanya untuk admin */}
      <RoleGuard adminOnly>
        <Button onClick={handleDelete} variant="destructive">
          Delete SO
        </Button>
      </RoleGuard>

      {/* Content dengan fallback */}
      <RoleGuard 
        roles={['admin']} 
        fallback={<p>Access denied. Admin only.</p>}
      >
        <AdminDashboard />
      </RoleGuard>
    </div>
  );
}
```

### 3. Function-based Role Checking

```javascript
import { useRole } from '@/hooks/useRole';

function MyComponent() {
  const { hasRole } = useRole();

  const handleAction = () => {
    if (hasRole(['admin', 'manager'])) {
      // Perform action
      console.log('Action performed');
    } else {
      alert('You do not have permission to perform this action');
    }
  };

  return (
    <Button onClick={handleAction}>
      Perform Action
    </Button>
  );
}
```

## 🔧 Konfigurasi Role

Sistem ini mendukung berbagai format role yang disimpan di localStorage:

### Format yang Didukung:

1. **Single String:**
```javascript
{
  "role": "admin"
}
```

2. **Array of Roles:**
```javascript
{
  "roles": ["admin", "manager", "user"]
}
```

3. **Alternative Field Names:**
```javascript
{
  "user_role": "admin",
  "user_roles": ["admin", "manager"]
}
```

### Role Detection Logic:

- **Admin Roles:** `admin`, `super`, `owner`
- **Case Insensitive:** `Admin`, `ADMIN`, `admin` semua dianggap sama
- **Partial Match:** `super_admin` akan terdeteksi sebagai admin

## 🛡️ Security Notes

1. **Client-side Only:** Role checking ini hanya di client-side untuk UX
2. **Server Validation:** Selalu validasi role di server-side untuk security
3. **Token-based:** Pastikan user data di localStorage valid dan up-to-date
4. **Logout Cleanup:** Clear localStorage saat logout

## 🔄 Refresh Role Data

Jika role user berubah (misal setelah login/logout), gunakan:

```javascript
const { refreshRole } = useRole();

// After login/logout
refreshRole();
```

## 📝 Best Practices

1. **Gunakan RoleGuard untuk UI elements**
2. **Gunakan hook untuk logic/function checking**
3. **Selalu ada fallback untuk non-admin users**
4. **Test dengan berbagai role scenarios**
5. **Document role requirements di setiap component**

## 🎨 Styling dengan Role

```javascript
// Conditional styling berdasarkan role
<div className={`card ${isUserAdmin ? 'border-red-500' : 'border-gray-300'}`}>
  <h2>Content</h2>
  {isUserAdmin && <span className="badge bg-red-500">Admin Only</span>}
</div>
```

---

**Happy Role Checking! 🎯**
