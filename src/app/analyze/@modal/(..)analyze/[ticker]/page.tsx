import * as React from 'react';
import { ModalContainer } from '@gpt10k/components';
export default function Ticker({params}: {params: {ticker: string}}) {
  return (
      <ModalContainer {...{header: 'Home'}} >
        <>{params.ticker} Stock Analysis</>
      </ModalContainer>
  )
}
