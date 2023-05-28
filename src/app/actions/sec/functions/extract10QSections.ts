const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const debug = require('debug')('10k');

export async function extract10QSections(apiToken: string, edgarUrl: string, partIdentifierMap: Record<string, string>) {
    debug(`extract10QSections called with: apiToken ${apiToken} edgarUrl: ${edgarUrl}, partIdentifierMap: ${partIdentifierMap}`);
    const sectionPromises = Object.entries(partIdentifierMap).map(async ([partName, identifier]) => {
      const url = `${process.env.SEC_API_ENDPOINT}/extractor?url=${edgarUrl}&item=${identifier}&type=text&token=${apiToken}`;
      debug(`extract10QSections url ${url}`);
      const response = await fetch(url);
      const data = await response.text();
      return [partName, data];
    });
  
    const sections = await Promise.all(sectionPromises);
    return Object.fromEntries(sections);
  }