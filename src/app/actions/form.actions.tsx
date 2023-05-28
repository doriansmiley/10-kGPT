'use server';
import { createMachine, interpret, assign } from 'xstate';

async function execute() {
    // TODO try catch the chain execution
    return 'done';
}

const chainMachine = createMachine({
    id: 'search',
    initial: 'invokeChain',
    context: {
      results: undefined,
      errorMessage: undefined,
      ticker: undefined,
    } as {
        ticker: string | undefined, 
        errorMessage?: string | undefined,
        results?: {value: string | undefined},
    },
    states: {
      invokeChain: {
        invoke: {
          id: 'search',
          src: execute,
          onError: {
            target: 'failure',
            actions: assign({
              errorMessage: (context, event) => {
                // event is:
                // { type: 'error.platform', data: 'No query specified' }
                return event.data;
              }
            })
          },
          onDone: {
            target: 'success',
            actions: assign({ results: (context, event) => event.data })
          }
        }
      },
      success: {
        type: 'final'
      },
      failure: {
        type: 'final'
      }
    }
  });
 
export async function analyzeStock({ticker}: {ticker: string}): Promise<{value: string, context: any}> {
    return new Promise(async (resolve, reject) => {
        chainMachine.withContext({
            ticker,
        })
        // Machine instance with internal state
        const toggleActor = interpret(chainMachine);
        toggleActor.subscribe((state) => {
            console.log(state.value);
            switch(state.value){
                case 'success':
                    resolve({value: state.value, context: state.context});
                    break;
                case 'failure':
                    reject({value: state.value, context: state.context})
            }
        })
        toggleActor.start();
    });
}