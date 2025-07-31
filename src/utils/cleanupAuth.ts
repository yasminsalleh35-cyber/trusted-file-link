import { supabase } from '@/integrations/supabase/client';

/**
 * Auth Cleanup Utilities
 * 
 * Purpose: Clean up existing auth users and start fresh
 * Use these functions to reset your authentication system
 */

export const listAllUsers = async () => {
  try {
    console.log('📋 Listing all users...');
    
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    console.log(`Found ${data.users.length} users:`);
    data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    return data.users;
  } catch (error) {
    console.error('Error listing users:', error);
    return [];
  }
};

export const deleteAllUsers = async () => {
  try {
    console.log('🗑️ Deleting all users...');
    
    // First, list all users
    const users = await listAllUsers();
    
    if (users.length === 0) {
      console.log('✅ No users to delete');
      return { success: true };
    }
    
    // Delete each user
    for (const user of users) {
      console.log(`Deleting user: ${user.email}`);
      
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error(`Failed to delete ${user.email}:`, error);
      } else {
        console.log(`✅ Deleted: ${user.email}`);
      }
    }
    
    console.log('🎉 All users deleted successfully!');
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting users:', error);
    return { success: false, error };
  }
};

export const deleteUserByEmail = async (email: string) => {
  try {
    console.log(`🗑️ Deleting user: ${email}`);
    
    // Find user by email
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const user = data.users.find(u => u.email === email);
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return { success: false, error: 'User not found' };
    }
    
    // Delete the user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) throw deleteError;
    
    console.log(`✅ Deleted user: ${email}`);
    return { success: true };
    
  } catch (error) {
    console.error(`Error deleting user ${email}:`, error);
    return { success: false, error };
  }
};

export const fullCleanup = async () => {
  console.log('🧹 Starting full cleanup...');
  console.log('⚠️  This will delete ALL users and data!');
  console.log('⚠️  Make sure you want to do this!');
  
  // Delete all auth users
  await deleteAllUsers();
  
  console.log('📋 Next steps:');
  console.log('1. Run the database cleanup SQL in Supabase Dashboard');
  console.log('2. Run adminSetup.setupTestData() to create fresh test data');
  
  return { success: true };
};

// Export for browser console usage
if (typeof window !== 'undefined') {
  (window as any).cleanupAuth = {
    listAllUsers,
    deleteAllUsers,
    deleteUserByEmail,
    fullCleanup
  };
}