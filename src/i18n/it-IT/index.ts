import indexPage from 'src/pages/IndexPage/i18n/it';
import mainLayout from 'src/layouts/MainLayout/i18n/it';
import authenticateUser from 'src/components/AuthenticateUser/i18n/it';
import signInPage from 'src/pages/SignInPage/i18n/it';

export default {
  failed: 'Azione fallita',
  success: 'Operazione completata',
  ...mainLayout,
  ...indexPage,
  ...authenticateUser,
  ...signInPage,
};
