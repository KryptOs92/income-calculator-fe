import indexPage from 'src/pages/IndexPage/i18n/en';
import mainLayout from 'src/layouts/MainLayout/i18n/en';
import authenticateUser from 'src/components/AuthenticateUser/i18n/en';
import registerUser from 'src/components/RegisterUser/i18n/en';
import signInPage from 'src/pages/SignInPage/i18n/en';
import verifyPage from 'src/pages/VerifyPage/i18n/en';
import resetPasswordPage from 'src/pages/ResetPasswordPage/i18n/en';

export default {
  failed: 'Action failed',
  success: 'Action was successful',
  ...mainLayout,
  ...indexPage,
  ...authenticateUser,
  ...registerUser,
  ...signInPage,
  ...verifyPage,
  ...resetPasswordPage,
};
