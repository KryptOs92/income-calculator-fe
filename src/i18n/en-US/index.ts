import indexPage from 'src/pages/IndexPage/i18n/en';
import mainLayout from 'src/layouts/MainLayout/i18n/en';
import authenticateUser from 'src/components/AuthenticateUser/i18n/en';
import signInPage from 'src/pages/SignInPage/i18n/en';

export default {
  failed: 'Action failed',
  success: 'Action was successful',
  ...mainLayout,
  ...indexPage,
  ...authenticateUser,
  ...signInPage,
};
