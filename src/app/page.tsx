import * as React from 'react';
import {useRef} from 'react';
import { useRouter } from 'next/navigation';
import { MainContainer, TickerForm } from '@gpt10k/components';

export default function Home() {

  return (
      <MainContainer {...{header: 'Home'}} >
        <TickerForm />
      </MainContainer>
  )
}
