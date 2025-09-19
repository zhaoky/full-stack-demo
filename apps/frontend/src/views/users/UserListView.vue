<template>
  <div class="user-list-view">
    <el-page-header @back="$router.go(-1)">
      <template #content>
        <span class="text-large font-600 mr-3">用户管理</span>
      </template>
    </el-page-header>

    <div class="user-list-content">
      <!-- 搜索和操作栏 -->
      <el-card class="search-card">
        <el-row :gutter="24">
          <el-col :span="24" :md="16">
            <el-input v-model="searchQuery" placeholder="搜索用户名或邮箱" clearable @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="24" :md="8">
            <div class="search-actions">
              <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
                <el-option label="全部" value="" />
                <el-option label="活跃" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
              <el-button type="primary" @click="handleAddUser">
                <el-icon><Plus /></el-icon>
                添加用户
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 用户列表 -->
      <el-card class="table-card">
        <el-table v-loading="loading" :data="filteredUsers" style="width: 100%" empty-text="暂无用户数据">
          <el-table-column width="60">
            <template #default="{ row }">
              <el-avatar :size="40" :src="row.avatar">
                {{ row.username.charAt(0).toUpperCase() }}
              </el-avatar>
            </template>
          </el-table-column>

          <el-table-column prop="username" label="用户名" min-width="120">
            <template #default="{ row }">
              <div>
                <div class="username">{{ row.username }}</div>
                <div class="email">{{ row.email }}</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)" size="small">
                {{ getRoleLabel(row.role) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="isActive" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
                {{ row.isActive ? '活跃' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="lastLogin" label="最后登录" width="160">
            <template #default="{ row }">
              {{ formatDate(row.lastLogin) }}
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="注册时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" text @click="handleEditUser(row)"> 编辑 </el-button>
              <el-button :type="row.isActive ? 'warning' : 'success'" size="small" text @click="handleToggleStatus(row)">
                {{ row.isActive ? '禁用' : '启用' }}
              </el-button>
              <el-button type="danger" size="small" text @click="handleDeleteUser(row)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.size" :total="pagination.total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </el-card>
    </div>

    <!-- 用户表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '添加用户'" width="500px" :before-close="handleDialogClose">
      <el-form ref="userFormRef" :model="userForm" :rules="userFormRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="请选择角色">
            <el-option label="用户" value="user" />
            <el-option label="管理员" value="admin" />
            <el-option label="版主" value="moderator" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="userForm.isActive" />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus } from '@element-plus/icons-vue';
import { getUserList, deleteUser, toggleUserStatus, updateUser, register } from '@api/user';
import type { IUser, CreateUserRequest, UpdateUserRequest, PaginationQuery } from '@types/api';

// 响应式数据
const loading = ref(false);
const submitting = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const userFormRef = ref<FormInstance>();

const users = ref<IUser[]>([]);

const pagination = ref({
  page: 1,
  size: 20,
  total: 0,
});

const userForm = ref({
  id: '',
  username: '',
  email: '',
  password: '',
  role: 'user' as 'user' | 'admin' | 'moderator',
  isActive: true,
});

// 表单验证规则
const userFormRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度在 3 到 30 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

// 计算属性
const filteredUsers = computed(() => {
  // 在使用真实API的情况下，过滤已经在服务端完成
  // 这里可以根据 statusFilter 进行本地过滤
  let result = users.value;

  if (statusFilter.value) {
    const isActive = statusFilter.value === 'active';
    result = result.filter((user) => user.isActive === isActive);
  }

  return result;
});

// 方法
const getRoleTagType = (role: string) => {
  const types = {
    admin: 'danger',
    moderator: 'warning',
    user: 'info',
  };
  return types[role as keyof typeof types] || 'info';
};

const getRoleLabel = (role: string) => {
  const labels = {
    admin: '管理员',
    moderator: '版主',
    user: '用户',
  };
  return labels[role as keyof typeof labels] || '用户';
};

const formatDate = (date: string | Date | null) => {
  if (!date) return '-';
  const d = new Date(date);
  return (
    d.toLocaleDateString('zh-CN') +
    ' ' +
    d.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

const loadUsers = async () => {
  loading.value = true;
  try {
    const query: PaginationQuery = {
      page: pagination.value.page,
      limit: pagination.value.size,
      search: searchQuery.value || undefined,
    };

    const response = await getUserList(query);
    users.value = response.data.data;
    pagination.value.total = response.data.pagination.total;
  } catch (error) {
    ElMessage.error('加载用户列表失败');
    console.error('加载用户失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // 重置页码并重新加载数据
  pagination.value.page = 1;
  loadUsers();
};

const handleAddUser = () => {
  isEdit.value = false;
  userForm.value = {
    id: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    isActive: true,
  };
  dialogVisible.value = true;
};

const handleEditUser = (user: IUser) => {
  isEdit.value = true;
  userForm.value = {
    id: user.id,
    username: user.username,
    email: user.email,
    password: '',
    role: user.role,
    isActive: user.isActive,
  };
  dialogVisible.value = true;
};

const handleToggleStatus = async (user: IUser) => {
  try {
    const action = user.isActive ? '禁用' : '启用';
    await ElMessageBox.confirm(`确定要${action}用户 "${user.username}" 吗？`, '确认操作');

    await toggleUserStatus(user.id);
    ElMessage.success(`${action}成功`);

    // 重新加载用户列表
    await loadUsers();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败');
    }
  }
};

const handleDeleteUser = async (user: IUser) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户 "${user.username}" 吗？此操作不可恢复！`, '确认删除', {
      type: 'warning',
    });

    await deleteUser(user.id);
    ElMessage.success('删除成功');

    // 重新加载用户列表
    await loadUsers();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

const handleSizeChange = (size: number) => {
  pagination.value.size = size;
  loadUsers();
};

const handleCurrentChange = (page: number) => {
  pagination.value.page = page;
  loadUsers();
};

const handleDialogClose = () => {
  dialogVisible.value = false;
  userFormRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!userFormRef.value) return;

  try {
    const valid = await userFormRef.value.validate();
    if (!valid) return;

    submitting.value = true;

    if (isEdit.value) {
      // 更新用户
      const updateData: UpdateUserRequest = {
        username: userForm.value.username,
        email: userForm.value.email,
        role: userForm.value.role,
        isActive: userForm.value.isActive,
      };
      await updateUser(userForm.value.id, updateData);
      ElMessage.success('更新成功');
    } else {
      // 创建用户
      const createData: CreateUserRequest = {
        username: userForm.value.username,
        email: userForm.value.email,
        password: userForm.value.password,
        role: userForm.value.role,
      };
      await register(createData);
      ElMessage.success('创建成功');
    }

    handleDialogClose();
    // 重新加载用户列表
    await loadUsers();
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped lang="scss">
.user-list-view {
  padding: var(--spacing-lg);
}

.user-list-content {
  margin-top: var(--spacing-lg);
}

.search-card {
  margin-bottom: var(--spacing-lg);

  .search-actions {
    display: flex;
    gap: var(--spacing-md);

    .el-select {
      flex: 1;
    }
  }
}

.table-card {
  .username {
    font-weight: var(--font-weight-semibold);
    color: var(--text-color-primary);
  }

  .email {
    font-size: var(--font-size-sm);
    color: var(--text-color-secondary);
    margin-top: 2px;
  }

  .pagination-container {
    margin-top: var(--spacing-lg);
    text-align: right;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

@media (max-width: 768px) {
  .user-list-view {
    padding: var(--spacing-md);
  }

  .search-actions {
    margin-top: var(--spacing-md);
    flex-direction: column;
  }

  .el-table {
    font-size: var(--font-size-sm);
  }

  .pagination-container {
    text-align: center;
  }
}
</style>
