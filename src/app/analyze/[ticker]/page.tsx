import * as React from 'react';
import { MainContainer } from '@gpt10k/components';
export default function Ticker({params}: {params: {ticker: string}}) {
  return (
      <MainContainer {...{header: `${params.ticker.toUpperCase()} Stock Analysis`}} >
        <p>Analysis Goes Here</p>
      </MainContainer>
  )
}
