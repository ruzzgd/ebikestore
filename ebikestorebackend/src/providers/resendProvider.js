// Re-export from brevoProvider for backward compatibility
export {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeCodeEmail,
} from './brevoProvider.js';

import brevoProvider from './brevoProvider.js';
export default brevoProvider;
