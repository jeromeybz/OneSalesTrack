<script setup>
import { ref, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { formatDate, initials } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const usersStore = useUsersStore()
const auth       = useAuthStore()
const toast      = useToastStore()

const showModal   = ref(false)
const showConfirm = ref(false)
const editingId   = ref(null)
const deletingId  = ref(null)
const saving      = ref(false)
const showPw      = ref(false)

const empty = () => ({ username: '', password: '', displayName: '', role: 'cashier' })
const form  = ref(empty())

onMounted(() => usersStore.fetchUsers())

function openCreate() {
  editingId.value = null
  form.value = empty()
  showPw.value = false
  showModal.value = true
}

function openEdit(user) {
  editingId.value = user.id
  form.value = { username: user.username, displayName: user.displayName, role: user.role, password: '' }
  showPw.value = false
  showModal.value = true
}

function confirmDelete(id) {
  if (id === auth.user?.id) { toast.error("You can't delete your own account."); return }
  deletingId.value = id
  showConfirm.value = true
}

async function save() {
  if (!form.value.displayName) { toast.error('Display name is required.'); return }
  if (!editingId.value && !form.value.password) { toast.error('Password is required.'); return }

  saving.value = true
  try {
    const payload = { ...form.value }
    if (editingId.value && !payload.password) delete payload.password

    if (editingId.value) {
      await usersStore.updateUser(editingId.value, payload)
      toast.success('User updated.')
    } else {
      await usersStore.createUser(payload)
      toast.success('User created.')
    }
    showModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Save failed.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  try {
    await usersStore.deleteUser(deletingId.value)
    toast.info('User deleted.')
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Delete failed.')
  } finally {
    showConfirm.value = false
    deletingId.value = null
  }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto p-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold">User Management</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">＋ Add User</button>
    </div>

    <!-- Users list -->
    <div class="space-y-3">
      <div
        v-for="u in usersStore.users"
        :key="u.id"
        class="card p-4 flex items-center gap-4"
      >
        <!-- Avatar -->
        <div
          class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          :class="u.role === 'admin' ? 'bg-accent/20 text-accent' : 'bg-success/20 text-success'"
        >
          {{ initials(u.displayName) }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm">{{ u.displayName }}</div>
          <div class="text-xs text-[hsl(var(--muted-fg))] font-mono">@{{ u.username }}</div>
        </div>

        <!-- Role badge -->
        <span
          class="badge shrink-0"
          :class="u.role === 'admin' ? 'badge-accent' : 'badge-success'"
        >
          {{ u.role }}
        </span>

        <!-- Last login -->
        <div class="text-xs text-[hsl(var(--muted-fg))] hidden sm:block shrink-0">
          {{ u.lastLogin ? formatDate(u.lastLogin) : 'Never' }}
        </div>

        <!-- Self indicator -->
        <span v-if="u.id === auth.user?.id" class="text-[10px] text-[hsl(var(--muted-fg))] italic hidden sm:block">You</span>

        <!-- Actions -->
        <div class="flex gap-2 shrink-0">
          <button class="btn btn-secondary btn-sm" @click="openEdit(u)">Edit</button>
          <button
            class="btn btn-danger btn-sm"
            :disabled="u.id === auth.user?.id"
            @click="confirmDelete(u.id)"
          >
            Delete
          </button>
        </div>
      </div>

      <div v-if="!usersStore.users.length" class="text-center py-16 text-[hsl(var(--muted-fg))] text-sm">
        No users found.
      </div>
    </div>

    <!-- User modal -->
    <AppModal
      :show="showModal"
      :title="editingId ? 'Edit User' : 'Add User'"
      @close="showModal = false"
    >
      <div class="space-y-4">
        <div>
          <label class="label">Display Name <span class="text-danger">*</span></label>
          <input v-model="form.displayName" type="text" class="input" placeholder="e.g. Maria Santos" />
        </div>
        <div>
          <label class="label">Username <span class="text-danger">*</span></label>
          <input
            v-model="form.username"
            type="text"
            class="input"
            placeholder="e.g. maria"
            :disabled="!!editingId"
            :class="{ 'opacity-50': editingId }"
          />
        </div>
        <div>
          <label class="label">
            Password
            <span v-if="!editingId" class="text-danger">*</span>
            <span v-else class="text-[hsl(var(--muted-fg))] normal-case tracking-normal font-normal ml-1">(leave blank to keep)</span>
          </label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              class="input pr-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))]/60 text-sm"
              @click="showPw = !showPw"
            >
              {{ showPw ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <div>
          <label class="label">Role</label>
          <select v-model="form.role" class="input">
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button class="btn btn-secondary btn-sm" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save User' }}
          </button>
        </div>
      </div>
    </AppModal>

    <!-- Confirm delete -->
    <ConfirmModal
      :show="showConfirm"
      title="Delete User"
      message="Are you sure you want to delete this user? This cannot be undone."
      danger
      @confirm="doDelete"
      @cancel="showConfirm = false"
    />
  </div>
</template>
