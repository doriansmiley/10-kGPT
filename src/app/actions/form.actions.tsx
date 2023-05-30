'use server';
import { createMachine, interpret, assign } from 'xstate';
import { processFiling, extract10Qand10KUrls, sectionIds10Q, sectionIds10K } from './sec/functions';
import { debug } from 'console';

async function execute() {
    // TODO try catch the chain execution
    return 'done';
}

const chainMachine = createMachine({
    id: 'search',
    initial: 'getURLs',
    context: {
        url: undefined,
        sectionIds: undefined,
        ticker: undefined,
        errorMessage: undefined,
        results: undefined,
        q10Url: undefined,
        k10Url: undefined,
    } as {
        url?: string,
        sectionIds?: Record<string, string>,
        ticker?: string,
        errorMessage?: string | undefined,
        results?: { value: string | undefined },
        q10Url?: string[],
        k10Url?: string[],
    },
    states: {
        getURLs: {
            invoke: {
                id: 'getURLs',
                src: (context, event) => extract10Qand10KUrls(context.ticker!),
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
                    target: 'process10QFilings',
                    actions: assign((context, event) => event.data),
                }
            }
        },
        process10QFilings: {
            invoke: {
                id: 'process10QFilings',
                src: (context, event) => processFiling(
                    {
                        urls: context.q10Url!,
                        type: '10-Q',
                        sectionIds: sectionIds10Q,
                        ticker: context.ticker!,
                    }
                ),
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
                    target: 'process10KFilings',
                    actions: assign({ results: (context, event) => event.data })
                }
            }
        },
        process10KFilings: {
            invoke: {
                id: 'process10KFilings',
                src: (context, event) => processFiling(
                    {
                        urls: context.k10Url!,
                        type: '10-K',
                        sectionIds: sectionIds10K,
                        ticker: context.ticker!,
                    }
                ),
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

export async function analyzeStock({ ticker }: { ticker: string }): Promise<{ value: string, context: any }> {
    debug(`analyzeStock called wtih ${ticker}`);
    return new Promise(async (resolve, reject) => {
        const machineWithContext = chainMachine.withContext({
            ticker,
        })
        // Machine instance with internal state
        const toggleActor = interpret(machineWithContext);
        toggleActor.subscribe((state) => {
            debug(`curent state is ${state.value}`);
            debug(`context is: ${JSON.stringify(state.context)}`);
            switch (state.value) {
                case 'success':
                    resolve({ value: state.value, context: state.context });
                    break;
                case 'failure':
                    reject({ value: state.value, context: state.context })
            }
        })
        toggleActor.start();
    });
}