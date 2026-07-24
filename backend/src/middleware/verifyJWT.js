import { supabase } from '../lib/supabase.js';
import { createVerifyJWT } from './createVerifyJWT.js';

export const verifyJWT = createVerifyJWT(supabase);

export default verifyJWT;
