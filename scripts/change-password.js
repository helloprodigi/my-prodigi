import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = '75d96863-62e8-4768-9c74-0fe1663fad80'

const { data, error } = await supabase.auth.admin.updateUserById(
    userId,
    {
        password: '4dMinProDIGI@1508'
    }
)

if (error) {
    console.error('Gagal mengubah password:', error)
    process.exit(1)
}

console.log('Password berhasil diubah!')
console.log('User:', data.user.email)