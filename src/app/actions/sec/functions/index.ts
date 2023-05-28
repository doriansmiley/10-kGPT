import processFiling from './processFiling';
import extract10Qand10KUrls from './extract10Qand10KUrls';

export {processFiling as processFiling};
export {extract10Qand10KUrls as extract10Qand10KUrls};
export const sectionIds10Q = {
    'Financial Statements': 'part1item1',
    'Management\'s Discussion and Analysis of Financial Condition and Results of Operations': 'part1item2',
    'Quantitative and Qualitative Disclosures About Market Risk': 'part1item3',
    'Controls and Procedures': 'part1item4',
    'Legal Proceedings': 'part2item1',
    'Risk Factors': 'part2item1a',
    'Unregistered Sales of Equity Securities and Use of Proceeds': 'part2item2',
    'Defaults Upon Senior Securities': 'part2item3',
    'Mine Safety Disclosures': 'part2item4',
    'Other Information': 'part2item5',
    'Exhibits': 'part2item6'
  };
export const sectionIds10K = {
    'Business': '1',
    'Risk Factors': '1A',
    'Unresolved Staff Comments': '1B',
    'Properties': '2',
    'Legal Proceedings': '3',
    'Mine Safety Disclosures': '4',
    'Market for Registrant’s Common Equity, Related Stockholder Matters and Issuer Purchases of Equity Securities': '5',
    'Selected Financial Data (prior to February 2021)': '6',
    'Management’s Discussion and Analysis of Financial Condition and Results of Operations': '7',
    'Quantitative and Qualitative Disclosures about Market Risk': '7A',
    'Financial Statements and Supplementary Data': '8',
    'Changes in and Disagreements with Accountants on Accounting and Financial Disclosure': '9',
    'Controls and Procedures': '9A',
    'Other Information': '9B',
    'Directors, Executive Officers and Corporate Governance': '10',
    'Executive Compensation': '11',
    'Security Ownership of Certain Beneficial Owners and Management and Related Stockholder Matters': '12',
    'Certain Relationships and Related Transactions, and Director Independence': '13',
    'Principal Accountant Fees and Services': '14'
};