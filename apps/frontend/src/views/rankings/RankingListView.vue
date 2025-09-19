<template>
  <div class="ranking-list-view">
    <el-page-header @back="$router.go(-1)">
      <template #content>
        <span class="text-large font-600 mr-3">排行榜</span>
      </template>
    </el-page-header>

    <div class="ranking-list-content">
      <!-- 搜索和操作栏 -->
      <el-card class="search-card">
        <el-row :gutter="24">
          <el-col :span="24" :md="12">
            <el-input v-model="searchQuery" placeholder="搜索排行榜名称" clearable @input="handleSearch">
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="24" :md="12">
            <div class="search-actions">
              <el-button type="primary" @click="handleAddRanking">
                <el-icon><Plus /></el-icon>
                创建排行榜
              </el-button>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 排行榜列表 -->
      <el-row :gutter="24">
        <el-col v-for="ranking in filteredRankings" :key="ranking.id" :span="24" :md="12" :lg="8" class="ranking-col">
          <el-card class="ranking-card" @click="handleViewRanking(ranking)">
            <template #header>
              <div class="ranking-header">
                <div class="ranking-title">
                  <h3>{{ ranking.name }}</h3>
                  <el-tag type="primary" size="small"> 分数: {{ ranking.score }} </el-tag>
                </div>
                <el-dropdown @command="handleCommand">
                  <el-button type="text" size="small">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="`edit:${ranking.id}`">编辑</el-dropdown-item>
                      <el-dropdown-item :command="`delete:${ranking.id}`" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>

            <div class="ranking-content">
              <div class="ranking-stats">
                <div class="stat-item">
                  <span class="stat-label">当前排名</span>
                  <span class="stat-value">{{ ranking.rankPosition || '-' }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">创建时间</span>
                  <span class="stat-value">{{ formatDate(ranking.createdAt) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">更新时间</span>
                  <span class="stat-value">{{ formatDate(ranking.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 空状态 -->
      <el-empty v-if="filteredRankings.length === 0" description="暂无排行榜数据" />
    </div>

    <!-- 排行榜表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排行榜' : '创建排行榜'" width="600px" :before-close="handleDialogClose">
      <el-form ref="rankingFormRef" :model="rankingForm" :rules="rankingFormRules" label-width="100px">
        <el-form-item label="排行榜名称" prop="name">
          <el-input v-model="rankingForm.name" placeholder="请输入排行榜名称" />
        </el-form-item>

        <el-form-item label="分数" prop="score">
          <el-input-number v-model="rankingForm.score" :min="0" placeholder="请输入分数" style="width: 100%" />
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
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Plus, More, User } from '@element-plus/icons-vue';
import { getRankingList, createRanking, updateRanking, deleteRanking } from '@api/ranking';
import type { IRanking, CreateRankingRequest, UpdateRankingRequest, RankingQuery } from '@types/api';

// 简化的排行榜界面，根据后端实际接口调整

const router = useRouter();

// 响应式数据
const loading = ref(false);
const submitting = ref(false);
const searchQuery = ref('');
const typeFilter = ref('');
const dialogVisible = ref(false);
const isEdit = ref(false);
const rankingFormRef = ref<FormInstance>();

const rankings = ref<IRanking[]>([]);

const rankingForm = ref({
  id: 0,
  name: '',
  score: 0,
});

// 表单验证规则
const rankingFormRules: FormRules = {
  name: [
    { required: true, message: '请输入排行榜名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' },
  ],
  score: [
    { required: true, message: '请输入分数', trigger: 'blur' },
    { type: 'number', min: 0, message: '分数必须大于等于0', trigger: 'blur' },
  ],
};

// 计算属性
const filteredRankings = computed(() => {
  let result = rankings.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((ranking) => ranking.name.toLowerCase().includes(query));
  }

  return result;
});

// 方法
const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

const loadRankings = async () => {
  loading.value = true;
  try {
    const query: RankingQuery = {
      page: 1,
      limit: 100,
      name: searchQuery.value || undefined,
      sortBy: 'score',
      sortOrder: 'desc',
    };

    const response = await getRankingList(query);
    rankings.value = response.data.data;
  } catch (error) {
    ElMessage.error('加载排行榜失败');
    console.error('加载排行榜失败:', error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  // 重新加载数据
  loadRankings();
};

const handleAddRanking = () => {
  isEdit.value = false;
  rankingForm.value = {
    id: 0,
    name: '',
    score: 0,
  };
  dialogVisible.value = true;
};

const handleViewRanking = (ranking: IRanking) => {
  // 可以添加查看详情的逻辑
  ElMessage.info(`查看排行榜: ${ranking.name}`);
};

const handleCommand = async (command: string) => {
  const [action, idStr] = command.split(':');
  const id = parseInt(idStr);
  const ranking = rankings.value.find((r) => r.id === id);

  if (!ranking) return;

  if (action === 'edit') {
    isEdit.value = true;
    rankingForm.value = {
      id: ranking.id,
      name: ranking.name,
      score: ranking.score,
    };
    dialogVisible.value = true;
  } else if (action === 'delete') {
    try {
      await ElMessageBox.confirm(`确定要删除排行榜 "${ranking.name}" 吗？此操作不可恢复！`, '确认删除', {
        type: 'warning',
      });

      await deleteRanking(ranking.id);
      ElMessage.success('删除成功');

      // 重新加载排行榜列表
      await loadRankings();
    } catch (error) {
      if (error !== 'cancel') {
        ElMessage.error('删除失败');
      }
    }
  }
};

const handleDialogClose = () => {
  dialogVisible.value = false;
  rankingFormRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!rankingFormRef.value) return;

  try {
    const valid = await rankingFormRef.value.validate();
    if (!valid) return;

    submitting.value = true;

    if (isEdit.value) {
      // 更新排行榜
      const updateData: UpdateRankingRequest = {
        name: rankingForm.value.name,
        score: rankingForm.value.score,
      };
      await updateRanking(rankingForm.value.id, updateData);
      ElMessage.success('更新成功');
    } else {
      // 创建排行榜
      const createData: CreateRankingRequest = {
        name: rankingForm.value.name,
        score: rankingForm.value.score,
      };
      await createRanking(createData);
      ElMessage.success('创建成功');
    }

    handleDialogClose();
    // 重新加载排行榜列表
    await loadRankings();
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
    console.error('提交失败:', error);
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadRankings();
});
</script>

<style scoped lang="scss">
.ranking-list-view {
  padding: var(--spacing-lg);
}

.ranking-list-content {
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

.ranking-col {
  margin-bottom: var(--spacing-lg);
}

.ranking-card {
  height: 100%;
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-large);
  }

  .ranking-header {
    @include flex-between;

    .ranking-title {
      @include flex-between;
      flex: 1;
      margin-right: var(--spacing-md);

      h3 {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--text-color-primary);
      }
    }
  }

  .ranking-content {
    .ranking-description {
      margin: 0 0 var(--spacing-md) 0;
      color: var(--text-color-secondary);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-relaxed);
    }

    .ranking-stats {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: var(--font-size-xs);
          color: var(--text-color-tertiary);
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--text-color-primary);
        }
      }
    }

    .ranking-preview {
      h4 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-semibold);
        color: var(--text-color-primary);
      }

      .top-users {
        .top-user {
          display: flex;
          align-items: center;
          margin-bottom: var(--spacing-sm);

          &:last-child {
            margin-bottom: 0;
          }

          .rank-badge {
            @include flex-center;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-bold);
            color: white;
            margin-right: var(--spacing-sm);

            &.rank-1 {
              background: linear-gradient(135deg, #ffd700, #ffed4e);
              color: #8b7000;
            }

            &.rank-2 {
              background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
              color: #666;
            }

            &.rank-3 {
              background: linear-gradient(135deg, #cd7f32, #daa560);
              color: #5c3317;
            }
          }

          .user-info {
            margin-left: var(--spacing-sm);
            flex: 1;

            .username {
              font-size: var(--font-size-sm);
              font-weight: var(--font-weight-medium);
              color: var(--text-color-primary);
            }

            .score {
              font-size: var(--font-size-xs);
              color: var(--text-color-secondary);
            }
          }
        }
      }

      .no-data {
        @include flex-center;
        flex-direction: column;
        padding: var(--spacing-lg);
        color: var(--text-color-tertiary);

        .el-icon {
          font-size: 24px;
          margin-bottom: var(--spacing-sm);
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

@media (max-width: 768px) {
  .ranking-list-view {
    padding: var(--spacing-md);
  }

  .search-actions {
    margin-top: var(--spacing-md);
    flex-direction: column;
  }

  .ranking-stats {
    flex-direction: column;
    gap: var(--spacing-sm);

    .stat-item {
      text-align: left !important;
    }
  }
}
</style>
