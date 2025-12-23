import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================
  // INSURERS
  // ============================================
  console.log('Creating insurers...');
  
  const insurers = await Promise.all([
    prisma.insurer.upsert({
      where: { code: 'BUPA' },
      update: {},
      create: {
        name: 'Bupa',
        code: 'BUPA',
        contactEmail: 'providers@bupa.co.uk',
        contactPhone: '0345 600 6960',
        portalUrl: 'https://www.bupa.co.uk/providers',
        avgResponseDays: 3,
      },
    }),
    prisma.insurer.upsert({
      where: { code: 'AXA' },
      update: {},
      create: {
        name: 'AXA Health',
        code: 'AXA',
        contactEmail: 'healthcareproviders@axa-ppp.co.uk',
        contactPhone: '0800 169 6784',
        portalUrl: 'https://www.axahealth.co.uk/providers',
        avgResponseDays: 4,
      },
    }),
    prisma.insurer.upsert({
      where: { code: 'VITALITY' },
      update: {},
      create: {
        name: 'Vitality',
        code: 'VITALITY',
        contactEmail: 'providers@vitality.co.uk',
        contactPhone: '0345 601 0456',
        portalUrl: 'https://www.vitality.co.uk/providers',
        avgResponseDays: 3,
      },
    }),
    prisma.insurer.upsert({
      where: { code: 'AVIVA' },
      update: {},
      create: {
        name: 'Aviva',
        code: 'AVIVA',
        contactEmail: 'healthcare.providers@aviva.co.uk',
        contactPhone: '0800 068 5821',
        portalUrl: 'https://www.aviva.co.uk/providers',
        avgResponseDays: 4,
      },
    }),
    prisma.insurer.upsert({
      where: { code: 'CIGNA' },
      update: {},
      create: {
        name: 'Cigna',
        code: 'CIGNA',
        contactEmail: 'ukproviders@cigna.com',
        contactPhone: '01onal 475 7000',
        portalUrl: 'https://www.cigna.co.uk/providers',
        avgResponseDays: 5,
      },
    }),
  ]);

  console.log(`✅ Created ${insurers.length} insurers`);

  // ============================================
  // REFERRAL TYPES
  // ============================================
  console.log('Creating referral types...');

  const referralTypes = await Promise.all([
    prisma.referralType.upsert({
      where: { code: 'MRI' },
      update: {},
      create: { name: 'MRI Scan', code: 'MRI', defaultSlaDays: 5 },
    }),
    prisma.referralType.upsert({
      where: { code: 'CT' },
      update: {},
      create: { name: 'CT Scan', code: 'CT', defaultSlaDays: 5 },
    }),
    prisma.referralType.upsert({
      where: { code: 'SPECIALIST' },
      update: {},
      create: { name: 'Specialist Consultation', code: 'SPECIALIST', defaultSlaDays: 7 },
    }),
    prisma.referralType.upsert({
      where: { code: 'PHYSIO' },
      update: {},
      create: { name: 'Physiotherapy', code: 'PHYSIO', defaultSlaDays: 7 },
    }),
    prisma.referralType.upsert({
      where: { code: 'MENTAL' },
      update: {},
      create: { name: 'Mental Health Assessment', code: 'MENTAL', defaultSlaDays: 5 },
    }),
    prisma.referralType.upsert({
      where: { code: 'CARDIAC' },
      update: {},
      create: { name: 'Cardiac Consultation', code: 'CARDIAC', defaultSlaDays: 3 },
    }),
    prisma.referralType.upsert({
      where: { code: 'SURGERY' },
      update: {},
      create: { name: 'Surgery', code: 'SURGERY', defaultSlaDays: 10 },
    }),
  ]);

  console.log(`✅ Created ${referralTypes.length} referral types`);

  // ============================================
  // DEMO CLINIC
  // ============================================
  console.log('Creating demo clinic...');

  const clinic = await prisma.clinic.upsert({
    where: { id: 'demo-clinic-001' },
    update: {},
    create: {
      id: 'demo-clinic-001',
      name: 'ClinicRoute Demo Clinic',
      address: '123 Harley Street, London W1G 6AX',
      phone: '+44 20 7946 0958',
      email: 'admin@democlinic.co.uk',
      website: 'https://democlinic.co.uk',
      slaDefaultDays: 5,
      subscriptionTier: 'GROWTH',
    },
  });

  console.log(`✅ Created clinic: ${clinic.name}`);

  // ============================================
  // DEMO USERS
  // ============================================
  console.log('Creating demo users...');

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@democlinic.co.uk' },
      update: {},
      create: {
        email: 'admin@democlinic.co.uk',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        clinicId: clinic.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emma.thompson@democlinic.co.uk' },
      update: {},
      create: {
        email: 'emma.thompson@democlinic.co.uk',
        passwordHash,
        firstName: 'Emma',
        lastName: 'Thompson',
        role: 'MANAGER',
        clinicId: clinic.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'sophie.clark@democlinic.co.uk' },
      update: {},
      create: {
        email: 'sophie.clark@democlinic.co.uk',
        passwordHash,
        firstName: 'Sophie',
        lastName: 'Clark',
        role: 'CLINICIAN',
        clinicId: clinic.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'james.wilson@democlinic.co.uk' },
      update: {},
      create: {
        email: 'james.wilson@democlinic.co.uk',
        passwordHash,
        firstName: 'James',
        lastName: 'Wilson',
        role: 'CLINICIAN',
        clinicId: clinic.id,
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // ============================================
  // DEMO CASES
  // ============================================
  console.log('Creating demo cases...');

  const bupa = insurers.find(i => i.code === 'BUPA')!;
  const axa = insurers.find(i => i.code === 'AXA')!;
  const vitality = insurers.find(i => i.code === 'VITALITY')!;
  const aviva = insurers.find(i => i.code === 'AVIVA')!;

  const emma = users.find(u => u.email === 'emma.thompson@democlinic.co.uk')!;
  const sophie = users.find(u => u.email === 'sophie.clark@democlinic.co.uk')!;

  // Use upsert for cases - keyed by reference_number for idempotency
  const cases = await Promise.all([
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0001' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0001',
        patientFirstName: 'Sarah',
        patientLastName: 'Mitchell',
        patientDob: new Date('1985-03-15'),
        referralType: 'MRI Scan',
        referringClinician: 'Dr. James Wilson',
        clinicalNotes: 'Urgent - patient experiencing severe symptoms',
        insurerId: bupa.id,
        insurerPolicyNumber: 'BUPA-123456',
        status: 'AWAITING_INSURER',
        priority: 'HIGH',
        slaDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        clinicId: clinic.id,
        createdById: emma.id,
        assignedToId: emma.id,
        submittedAt: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0002' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0002',
        patientFirstName: 'Michael',
        patientLastName: 'Roberts',
        patientDob: new Date('1972-08-22'),
        referralType: 'Physiotherapy',
        referringClinician: 'Dr. Amanda Foster',
        clinicalNotes: 'Post-surgery rehabilitation',
        insurerId: axa.id,
        status: 'APPROVED',
        priority: 'MEDIUM',
        slaDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        clinicId: clinic.id,
        createdById: sophie.id,
        assignedToId: sophie.id,
        approvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0003' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0003',
        patientFirstName: 'Emily',
        patientLastName: 'Watson',
        patientDob: new Date('1990-11-08'),
        referralType: 'Specialist Consultation',
        referringClinician: 'Dr. Sarah Bennett',
        clinicalNotes: 'Dermatology referral',
        insurerId: vitality.id,
        status: 'RECEIVED',
        priority: 'LOW',
        slaDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        clinicId: clinic.id,
        createdById: emma.id,
        assignedToId: emma.id,
      },
    }),
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0004' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0004',
        patientFirstName: 'David',
        patientLastName: 'Chen',
        patientDob: new Date('1968-04-30'),
        referralType: 'CT Scan',
        referringClinician: 'Dr. James Wilson',
        clinicalNotes: 'Follow-up imaging required',
        insurerId: bupa.id,
        status: 'SUBMITTED',
        priority: 'HIGH',
        slaDeadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        slaBreached: true,
        clinicId: clinic.id,
        createdById: sophie.id,
        assignedToId: sophie.id,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0005' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0005',
        patientFirstName: 'Jessica',
        patientLastName: 'Brown',
        patientDob: new Date('1995-07-12'),
        referralType: 'Mental Health Assessment',
        referringClinician: 'Dr. Amanda Foster',
        clinicalNotes: 'Initial psychiatric evaluation',
        insurerId: aviva.id,
        status: 'TREATMENT_SCHEDULED',
        priority: 'MEDIUM',
        slaDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        clinicId: clinic.id,
        createdById: emma.id,
        assignedToId: emma.id,
        approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.case.upsert({
      where: { referenceNumber: 'REF-2024-0006' },
      update: {},
      create: {
        referenceNumber: 'REF-2024-0006',
        patientFirstName: 'Thomas',
        patientLastName: 'Wright',
        patientDob: new Date('1958-12-03'),
        referralType: 'Cardiac Consultation',
        referringClinician: 'Dr. James Wilson',
        clinicalNotes: 'Treatment completed successfully',
        insurerId: bupa.id,
        status: 'CLOSED',
        priority: 'HIGH',
        slaDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        clinicId: clinic.id,
        createdById: sophie.id,
        assignedToId: sophie.id,
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${cases.length} demo cases`);

  // ============================================
  // AUDIT LOGS (only create if case was just created)
  // ============================================
  console.log('Creating audit logs...');

  for (const caseData of cases) {
    // Check if audit log already exists for this case
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        caseId: caseData.id,
        action: 'CREATE',
      },
    });

    if (!existingLog) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Case',
          entityId: caseData.id,
          description: `Case ${caseData.referenceNumber} created`,
          userId: caseData.createdById,
          caseId: caseData.id,
        },
      });

      await prisma.caseStatusHistory.create({
        data: {
          caseId: caseData.id,
          toStatus: 'RECEIVED',
          changedById: caseData.createdById,
          reason: 'Case created',
        },
      });
    }
  }

  console.log('✅ Created audit logs and status history');

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:    admin@democlinic.co.uk / Password123!');
  console.log('  Manager:  emma.thompson@democlinic.co.uk / Password123!');
  console.log('  Staff:    sophie.clark@democlinic.co.uk / Password123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
