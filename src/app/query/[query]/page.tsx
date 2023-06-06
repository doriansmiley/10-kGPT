import * as React from 'react';
import { MainContainer, QueryStock } from '@gpt10k/components';
const debug = require('debug')('10k');
export default function QueryPage({params}: {params: {query: string}}) {
  debug(`QueryPage params: ${JSON.stringify(params)}`);
  return (
      <MainContainer {...{header: `Results`}} >
        <QueryStock query={params.query} />
      </MainContainer>
  )
}