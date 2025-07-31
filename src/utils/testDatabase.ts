import { supabase } from '@/integrations/supabase/client';

/**
 * Test Database Utilities
 * 
 * Purpose: Test and debug database functionality
 */

export const testDatabaseSetup = async () => {
  console.log('🗄️ Testing database setup...');
  
  try {
    // Test 1: Check if files table exists and is accessible
    console.log('1️⃣ Testing files table...');
    const { data: filesData, error: filesError } = await supabase
      .from('files')
      .select('count')
      .limit(1);
    
    if (filesError) {
      console.error('❌ Files table error:', filesError);
      return false;
    }
    
    console.log('✅ Files table accessible');
    
    // Test 2: Check if file_assignments table exists
    console.log('2️⃣ Testing file_assignments table...');
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('file_assignments')
      .select('count')
      .limit(1);
    
    if (assignmentsError) {
      console.error('❌ File assignments table error:', assignmentsError);
      return false;
    }
    
    console.log('✅ File assignments table accessible');
    
    // Test 3: Check if profiles table exists
    console.log('3️⃣ Testing profiles table...');
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError);
      return false;
    }
    
    console.log('✅ Profiles table accessible');
    
    // Test 4: Check current user profile
    console.log('4️⃣ Testing current user profile...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user');
      return false;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ User profile error:', profileError);
      
      // Try to create profile
      console.log('🔧 Attempting to create user profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.email?.split('@')[0] || 'User',
          role: 'admin' // Default to admin for testing
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Failed to create profile:', createError);
        return false;
      }
      
      console.log('✅ User profile created:', newProfile);
    } else {
      console.log('✅ User profile found:', userProfile);
    }
    
    console.log('🎉 Database setup test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
};

export const createTestFile = async () => {
  console.log('📄 Creating test file record...');
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user');
      return false;
    }
    
    const testFile = {
      id: crypto.randomUUID(),
      name: `test-${Date.now()}.txt`,
      original_name: 'test-file.txt',
      file_path: `test/test-${Date.now()}.txt`,
      file_size: 1024,
      mime_type: 'text/plain',
      uploaded_by: user.id,
      description: 'Test file for debugging',
      access_level: 'private'
    };
    
    const { data, error } = await supabase
      .from('files')
      .insert(testFile)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Failed to create test file:', error);
      return false;
    }
    
    console.log('✅ Test file created:', data);
    
    // Clean up test file
    setTimeout(async () => {
      await supabase.from('files').delete().eq('id', testFile.id);
      console.log('🧹 Test file cleaned up');
    }, 5000);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test file creation failed:', error);
    return false;
  }
};