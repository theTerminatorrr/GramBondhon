// seed.js
// Populates the grambandhan database with sample data for demo/dev purposes.
// Run with: node seed.js
//
// Insertion order matters ΓÇö each table only inserts after the tables
// it has foreign keys pointing to already exist.

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding grambandhan database...\n');

  // ------------------------------------------------------------
  // 1. USERS (base identity ΓÇö everything else hangs off this)
  // ------------------------------------------------------------
  const farmerUser = await prisma.users.create({
    data: {
      name: 'Abdul Karim',
      email: 'karim.farmer@example.com',
      phone: '+8801711000001',
      password_hash: 'placeholder_hash_1', // a real app would bcrypt-hash a real password
      role: 'farmer',
      is_verified: true,
      kyc_status: 'verified',
    },
  });

  const investorUser = await prisma.users.create({
    data: {
      name: 'Rashida Begum',
      email: 'rashida.investor@example.com',
      phone: '+8801711000002',
      password_hash: 'placeholder_hash_2',
      role: 'investor',
      is_verified: true,
      kyc_status: 'verified',
    },
  });

  const agentUser = await prisma.users.create({
    data: {
      name: 'Jasim Uddin',
      email: 'jasim.agent@example.com',
      phone: '+8801711000003',
      password_hash: 'placeholder_hash_3',
      role: 'field_agent',
      is_verified: true,
      kyc_status: 'verified',
    },
  });

  const buyerUser = await prisma.users.create({
    data: {
      name: 'Nusrat Jahan',
      email: 'nusrat.buyer@example.com',
      phone: '+8801711000004',
      password_hash: 'placeholder_hash_4',
      role: 'buyer',
      is_verified: true,
      kyc_status: 'verified',
    },
  });

  console.log('Created 4 users (farmer, investor, field agent, buyer)');

  // ------------------------------------------------------------
  // 2. ROLE-SPECIFIC PROFILES (1:1 with users)
  // ------------------------------------------------------------
  const farmerProfile = await prisma.farmer_profiles.create({
    data: {
      farmer_id: farmerUser.user_id,
      land_size: 3.5,
      location: 'Bogura, Rajshahi',
      crops_grown: 'Rice, Jute',
      rating: 4.5,
    },
  });

  const investorProfile = await prisma.investor_profiles.create({
    data: {
      investor_id: investorUser.user_id,
      total_invested: 50000.0,
      wallet_balance: 20000.0,
      risk_profile: 'moderate',
    },
  });

  const agentProfile = await prisma.field_agent_profiles.create({
    data: {
      agent_id: agentUser.user_id,
      assigned_region: 'Rajshahi Division',
    },
  });

  console.log('Created role profiles for farmer, investor, and field agent');

  // ------------------------------------------------------------
  // 3. PROJECT (created by the farmer)
  // ------------------------------------------------------------
  const project = await prisma.projects.create({
    data: {
      farmer_id: farmerProfile.farmer_id,
      title: 'High-Yield Boro Rice Cultivation',
      description:
        'Season-long Boro rice cultivation on 3.5 acres using improved irrigation techniques.',
      crop_type: 'Rice',
      fund_goal: 100000.0,
      fund_raised: 30000.0,
      start_date: new Date('2026-01-15'),
      end_date: new Date('2026-05-15'),
      status: 'active',
    },
  });

  console.log('Created 1 project:', project.title);

  // ------------------------------------------------------------
  // 4. INVESTMENT (investor funds the project)
  // ------------------------------------------------------------
  const investment = await prisma.investments.create({
    data: {
      investor_id: investorProfile.investor_id,
      project_id: project.project_id,
      amount: 30000.0,
      expected_return: 34500.0,
      status: 'active',
    },
  });

  console.log('Created 1 investment: 30,000 into', project.title);

  // ------------------------------------------------------------
  // 5. MILESTONE UPDATE (field agent verifies progress)
  // ------------------------------------------------------------
  await prisma.milestone_updates.create({
    data: {
      project_id: project.project_id,
      verified_by: agentProfile.agent_id,
      notes: 'Seedling stage complete. Irrigation channels functioning well.',
      photo_urls: ['https://example.com/photos/plot1_seedling.jpg'],
      expense_log: 5000.0,
    },
  });

  console.log('Created 1 milestone update');

  // ------------------------------------------------------------
  // 6. RISK SCORE (AI-based risk suggestion)
  // ------------------------------------------------------------
  await prisma.risk_scores.create({
    data: {
      project_id: project.project_id,
      score: 22.5,
      level: 'low',
      factors:
        'Stable rainfall pattern, experienced farmer, no pest history in region',
      recommendation: 'Low risk. Recommended for standard insurance coverage.',
    },
  });

  console.log('Created 1 risk score');

  // ------------------------------------------------------------
  // 7. INSURANCE POLICY + CLAIM
  // ------------------------------------------------------------
  const policy = await prisma.insurance_policies.create({
    data: {
      project_id: project.project_id,
      coverage_type: 'Crop failure coverage',
      premium: 1500.0,
      status: 'active',
    },
  });

  console.log('Created 1 insurance policy');

  // ------------------------------------------------------------
  // 8. PRODUCT LISTING (farmer sells produce on marketplace)
  // ------------------------------------------------------------
  const listing = await prisma.product_listings.create({
    data: {
      producer_id: farmerUser.user_id,
      name: 'Premium Boro Rice (50kg sack)',
      category: 'Rice',
      price: 2500.0,
      quantity: 40,
      description: 'Freshly harvested Boro rice, sun-dried and cleaned.',
      delivery_area: 'Dhaka, Rajshahi',
    },
  });

  console.log('Created 1 product listing');

  // ------------------------------------------------------------
  // 9. ORDER (buyer purchases from the marketplace)
  // ------------------------------------------------------------
  await prisma.orders.create({
    data: {
      buyer_id: buyerUser.user_id,
      listing_id: listing.listing_id,
      quantity: 2,
      total_price: 5000.0,
      status: 'confirmed',
    },
  });

  console.log('Created 1 order');

  // ------------------------------------------------------------
  // 10. TRANSACTION (payment for the investment)
  // ------------------------------------------------------------
  await prisma.transactions.create({
    data: {
      user_id: investorUser.user_id,
      amount: 30000.0,
      type: 'investment',
      method: 'bkash',
      status: 'completed',
      reference_id: investment.investment_id,
    },
  });

  console.log('Created 1 transaction');

  // ------------------------------------------------------------
  // 11. RATING (investor rates the farmer after a good update)
  // ------------------------------------------------------------
  await prisma.ratings.create({
    data: {
      from_user_id: investorUser.user_id,
      to_user_id: farmerUser.user_id,
      project_id: project.project_id,
      stars: 5,
      comment: 'Great communication and progress updates. Very trustworthy.',
    },
  });

  console.log('Created 1 rating');

  // ------------------------------------------------------------
  // 12. NOTIFICATION
  // ------------------------------------------------------------
  await prisma.notifications.create({
    data: {
      user_id: farmerUser.user_id,
      message:
        'Your project "High-Yield Boro Rice Cultivation" received a new investment of 30,000 taka.',
      is_read: false,
    },
  });

  console.log('Created 1 notification');

  console.log('\nSeeding complete.');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
