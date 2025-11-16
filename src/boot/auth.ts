import { defineBoot } from '#q-app/wrappers';
import { useUserStore } from 'src/stores/user-store';

export default defineBoot(async () => {
  const userStore = useUserStore();
  await userStore.evaluateToken();
});
