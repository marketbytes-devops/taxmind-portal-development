import { db } from '@/database';
import * as models from '@/database/models';

/**
 * Site Contents Seeder
 * Creates initial site configuration with default values for the tax filing system
 * This is a singleton configuration that should only have one record
 */
export const seedSiteContents = async () => {
  try {
    console.log('Starting Site Contents seeding...');

    // Check if site contents already exist
    const existingSiteContents = await db.query.siteContents.findFirst();

    if (existingSiteContents) {
      console.log('✓ Site contents already exist. Skipping seeding.');
      return;
    }

    // Default site configuration values
    const defaultSiteContents = {
      homeTitle: 'Welcome to TaxMind - Your Trusted Tax Filing Partner',
      homeContent: `
        <h2>Professional Tax Filing Services in Ireland</h2>
        <p>TaxMind provides comprehensive tax filing services for individuals and businesses in Ireland. Our expert team ensures accurate, timely, and compliant tax submissions while maximizing your eligible deductions and credits.</p>
        
        <h3>Our Services Include:</h3>
        <ul>
          <li>Personal Income Tax Returns</li>
          <li>Self-Employment Tax Filing</li>
          <li>VAT Returns and Compliance</li>
          <li>Capital Gains Tax Calculations</li>
          <li>Tax Planning and Advisory</li>
          <li>PAYE and USC Optimization</li>
        </ul>
        
        <p>With years of experience in Irish tax law and regulations, we help you navigate the complexities of the tax system while ensuring full compliance with Revenue requirements.</p>
      `.trim(),
      headerEmail: 'info@taxmind.ie',
      headerPhone: '+353 1 234 5678',
      aboutUsContent: `
        <h2>About TaxMind</h2>
        <p>Founded with the mission to simplify tax compliance for Irish taxpayers, TaxMind has been serving individuals and businesses across Ireland with professional tax filing services.</p>
        
        <h3>Our Mission</h3>
        <p>To provide accurate, efficient, and affordable tax filing services while ensuring complete compliance with Irish tax regulations. We believe that managing your taxes should be straightforward, not stressful.</p>
        
        <h3>Why Choose TaxMind?</h3>
        <ul>
          <li><strong>Expertise:</strong> Our team consists of qualified tax professionals with extensive knowledge of Irish tax law</li>
          <li><strong>Accuracy:</strong> We use advanced systems and thorough review processes to ensure error-free submissions</li>
          <li><strong>Efficiency:</strong> Quick turnaround times without compromising on quality</li>
          <li><strong>Compliance:</strong> Full adherence to Revenue requirements and GDPR regulations</li>
          <li><strong>Support:</strong> Ongoing support and advice for all your tax-related queries</li>
        </ul>
        
        <h3>Our Values</h3>
        <ul>
          <li><strong>Integrity:</strong> Honest and transparent service in all our dealings</li>
          <li><strong>Professionalism:</strong> Maintaining the highest standards of service delivery</li>
          <li><strong>Confidentiality:</strong> Strict protection of client information and privacy</li>
          <li><strong>Innovation:</strong> Continuously improving our services through technology</li>
        </ul>
        
        <p>Trust TaxMind to handle your tax affairs with the care and expertise they deserve.</p>
      `.trim(),
      commissionPercentage: 15, // 15% commission rate
      vaPercentage: 23, // 23% VAT rate (standard rate in Ireland)
    };

    // Insert the default site contents
    await db.insert(models.siteContents).values(defaultSiteContents);

    console.log('✓ Site contents seeded successfully with default configuration');
    console.log('  - Home title and content configured');
    console.log('  - Contact information set (email, phone)');
    console.log('  - About us content added');
    console.log('  - Commission rate set to 15%');
    console.log('  - VAT rate set to 23% (Ireland standard rate)');
  } catch (error) {
    console.error('✗ Site contents seeding failed:', error);
    throw error;
  }
};
