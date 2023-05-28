import * as React from 'react';
import { MainContainer, StockAnalysis } from '@gpt10k/components';
export default function Ticker({params}: {params: {ticker: string}}) {
  return (
      <MainContainer {...{header: `${params.ticker.toUpperCase()} Stock Analysis`}} >
        <StockAnalysis ticker={params.ticker} />
      </MainContainer>
  )
}
