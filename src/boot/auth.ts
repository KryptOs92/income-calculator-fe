import { defineBoot } from '#q-app/wrappers';
import { useUserStore } from 'src/stores/user-store';

export default defineBoot(() => {
  const userStore = useUserStore();
  userStore.evaluateToken();
});
