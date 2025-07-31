#!/usr/bin/env node

/**
 * Demo Data Setup Script
 * 
 * This script creates demo accounts and sample data for testing the application
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snplwgyewoljrprqpdrm.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createDemoAccounts() {
  console.log('🚀 Creating demo accounts...');

  const accounts = [
    {
      email: 'admin@financehub.com',
      password: 'admin123456',
      role: 'admin',
      full_name: 'System Administrator'
    },
    {
      email: 'client@acme.com',
      password: 'client123456',
      role: 'client',
      full_name: 'John Client',
      company_name: 'ACME Corporation'
    },
    {
      email: 'user@acme.com',
      password: 'user123456',
      role: 'user',
      full_name: 'Jane User'
    }
  ];

  for (const account of accounts) {
    try {
      console.log(`Creating ${account.role}: ${account.email}`);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`⚠️  ${account.email} already exists, skipping...`);
          continue;
        }
        throw authError;
      }

      // Create client record if needed
      let clientId = null;
      if (account.role === 'client' && account.company_name) {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .upsert({
            company_name: account.company_name,
            contact_email: account.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'contact_email' })
          .select()
          .single();

        if (clientError) {
          console.error('Client creation error:', clientError);
        } else {
          clientId = clientData.id;
        }
      }

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: account.email,
          full_name: account.full_name,
          role: account.role,
          client_id: clientId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      } else {
        console.log(`✅ Created ${account.role}: ${account.email}`);
      }

    } catch (error) {
      console.error(`❌ Failed to create ${account.email}:`, error.message);
    }
  }
}

async function createSampleFiles() {
  console.log('📁 Creating sample files...');

  // Get admin user
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', 'admin@financehub.com')
    .single();

  if (!adminProfile) {
    console.log('⚠️  Admin user not found, skipping file creation');
    return;
  }

  const sampleFiles = [
    {
      filename: 'Welcome_Guide.pdf',
      original_filename: 'Welcome_Guide.pdf',
      file_type: 'application/pdf',
      file_size: 1024000,
      storage_path: 'files/welcome-guide.pdf',
      uploaded_by: adminProfile.id,
      description: 'Welcome guide for new users'
    },
    {
      filename: 'Company_Policy.docx',
      original_filename: 'Company_Policy.docx',
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      file_size: 512000,
      storage_path: 'files/company-policy.docx',
      uploaded_by: adminProfile.id,
      description: 'Company policies and procedures'
    },
    {
      filename: 'Q4_Report.xlsx',
      original_filename: 'Q4_Report.xlsx',
      file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      file_size: 2048000,
      storage_path: 'files/q4-report.xlsx',
      uploaded_by: adminProfile.id,
      description: 'Quarterly financial report'
    }
  ];

  for (const file of sampleFiles) {
    try {
      const { error } = await supabase
        .from('files')
        .upsert(file, { onConflict: 'filename' });

      if (error) {
        console.error('File creation error:', error);
      } else {
        console.log(`✅ Created file: ${file.filename}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create file ${file.filename}:`, error.message);
    }
  }
}

async function setupStorageBucket() {
  console.log('🪣 Setting up storage bucket...');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError);
      return;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'files');
    
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket('files', {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError);
      } else {
        console.log('✅ Storage bucket created successfully');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }
  } catch (error) {
    console.error('❌ Storage setup error:', error.message);
  }
}

async function main() {
  console.log('🎯 Setting up demo data for Trusted File Link...\n');

  try {
    await setupStorageBucket();
    await createDemoAccounts();
    await createSampleFiles();

    console.log('\n✅ Demo data setup complete!');
    console.log('\n📧 Demo Credentials:');
    console.log('   Admin: admin@financehub.com / admin123456');
    console.log('   Client: client@acme.com / client123456');
    console.log('   User: user@acme.com / user123456');
    console.log('\n🌐 You can now test the application with these accounts!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();