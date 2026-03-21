import { supabase } from '@/integrations/supabase/client';

// Abstract geometric pattern URLs for demo profiles
const DEMO_AVATARS = [
  'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=200&h=200&fit=crop', // Geometric blue
  'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=200&h=200&fit=crop', // Abstract gradient
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop', // Minimal pattern
  'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=200&h=200&fit=crop', // Purple gradient
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=200&h=200&fit=crop', // Colorful abstract
];

const DEMO_PRODUCT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', // Watch
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', // Headphones
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop', // Sunglasses
];

/**
 * Generate demo welcome posts for a new tribe
 */
export async function generateTribeDemoPosts(
  userId: string,
  tribeName: string
): Promise<{ success: boolean; error?: string }> {
  const demoPosts = [
    {
      user_id: userId,
      content: `🎉 Welcome to ${tribeName}!\n\nThis is your official campus community. Connect with fellow students, share updates, and stay informed about everything happening on campus.\n\n📌 This is a sample post. Your tribe content will appear here.`,
      visibility: 'private',
      target_tribe: tribeName,
    },
    {
      user_id: userId,
      content: `📋 Community Guidelines\n\n• Respect all members and their opinions\n• No spam or promotional content without approval\n• Keep discussions relevant to campus life\n• Report inappropriate content immediately\n\n🛡️ Together, we build a safe space for everyone.`,
      visibility: 'private',
      target_tribe: tribeName,
    },
    {
      user_id: userId,
      content: `📅 Upcoming Events\n\nStay tuned for announcements about:\n• Campus meetups and socials\n• Academic workshops\n• Student organization events\n• Career fairs and opportunities\n\n💡 As a Tribe Admin, you can post updates here for your entire community.`,
      visibility: 'private',
      target_tribe: tribeName,
    },
  ];

  try {
    const { error } = await supabase.from('posts').insert(demoPosts);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error generating tribe demo posts:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate demo products for a new brand account
 * Creates 3 products linked to the brand's user_id
 * @param autoApprove - Set to true to mark products as approved (visible in market)
 */
export async function generateBrandDemoProducts(
  userId: string,
  brandName: string,
  autoApprove: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const demoProducts = [
    {
      user_id: userId,
      title: `${brandName} - Product A`,
      description: `Exclusive offer from ${brandName}. This is a demo product showcasing how your listings will appear in the Bwalo Market. Replace this with your actual products to reach thousands of students.`,
      price: 9999,
      image_url: DEMO_PRODUCT_IMAGES[0],
      is_active: true,
      is_special_offer: false,
      discount_code: 'DEMO10',
      buy_link: null,
      status: autoApprove ? 'approved' : 'pending_approval',
      target_tribe: 'global'
    },
    {
      user_id: userId,
      title: `${brandName} - Exclusive Deal`,
      description: `Limited time offer from ${brandName}! This sample product demonstrates special promotions. As a Brand Partner, you can highlight deals that students will love.`,
      price: 4999,
      image_url: DEMO_PRODUCT_IMAGES[1],
      is_active: true,
      is_special_offer: true,
      discount_code: 'STUDENT25',
      buy_link: null,
      status: autoApprove ? 'approved' : 'pending_approval',
      target_tribe: 'global'
    },
    {
      user_id: userId,
      title: `${brandName} - Special Offer`,
      description: `Another great product from ${brandName}. Show off your full catalog to engage with the student community.`,
      price: 7500,
      image_url: DEMO_PRODUCT_IMAGES[2],
      is_active: true,
      is_special_offer: false,
      discount_code: 'CAMPUS15',
      buy_link: null,
      status: autoApprove ? 'approved' : 'pending_approval',
      target_tribe: 'global'
    },
  ];

  try {
    const { error } = await supabase.from('products').insert(demoProducts);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error generating brand demo products:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate a promotional billboard post for a new brand
 */
export async function generateBrandDemoPost(
  userId: string,
  brandName: string
): Promise<{ success: boolean; error?: string }> {
  const demoPost = {
    user_id: userId,
    content: `🏪 Welcome ${brandName} to Mijedu!\n\nWe're excited to partner with the student community. Check out our exclusive offers in the Bwalo Market.\n\n📌 This is a sample promotional post. As a Brand Partner, your content will reach thousands of students across all campuses.`,
    visibility: 'public',
    target_tribe: null,
  };

  try {
    const { error } = await supabase.from('posts').insert(demoPost);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error('Error generating brand demo post:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get a random demo avatar URL
 */
export function getRandomDemoAvatar(): string {
  return DEMO_AVATARS[Math.floor(Math.random() * DEMO_AVATARS.length)];
}

/**
 * Generate all demo content for a new account
 * @param autoApprove - When true, demo products are set to 'approved' status
 */
export async function generateDemoContentForAccount(
  userId: string,
  accountType: 'tribe_admin' | 'influencer' | 'vip_brand',
  tribeName?: string,
  brandName?: string,
  autoApprove: boolean = false
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (accountType === 'tribe_admin' && tribeName) {
    const result = await generateTribeDemoPosts(userId, tribeName);
    if (!result.success) errors.push(`Tribe posts: ${result.error}`);
  }

  if (accountType === 'vip_brand' && brandName) {
    const productResult = await generateBrandDemoProducts(userId, brandName, autoApprove);
    if (!productResult.success) errors.push(`Products: ${productResult.error}`);

    const postResult = await generateBrandDemoPost(userId, brandName);
    if (!postResult.success) errors.push(`Brand post: ${postResult.error}`);
  }

  return { success: errors.length === 0, errors };
}
