import { describe, it, expect } from 'vitest';
import { MessageList } from '../agent';
import type { Processor } from '../processors';
import { RequestContext } from '../request-context';
import { MockMemory } from './mock';
import type { MastraDBMessage } from './types';

async function renderWorkingMemoryInstruction(agentManaged: boolean | undefined) {
  const memory = new MockMemory({
    options: { workingMemory: { enabled: true, template: '# Profile\n- Name:', agentManaged } },
  });
  const thread = await memory.createThread({ threadId: 'thread-1', resourceId: 'resource-1' });

  const requestContext = new RequestContext();
  requestContext.set('MastraMemory', { thread, resourceId: 'resource-1' });

  const processors = await memory.getInputProcessors([], requestContext);
  const workingMemory = processors.find(p => (p as Processor).id === 'working-memory') as Processor;

  const messages: MastraDBMessage[] = [
    {
      id: 'msg-1',
      role: 'user',
      content: { format: 2, parts: [{ type: 'text', text: 'Hello' }] },
      createdAt: new Date(),
    },
  ];
  const messageList = new MessageList();
  messageList.add(messages, 'input');
  await workingMemory.processInput!({
    messages,
    messageList,
    abort: () => {
      throw new Error('Aborted');
    },
    requestContext,
  } as any);

  return {
    tools: Object.keys(memory.listTools()),
    system: messageList.getAllSystemMessages().map(m => (typeof m.content === 'string' ? m.content : '')),
  };
}

describe('workingMemory.agentManaged', () => {
  it('does not instruct the model to call updateWorkingMemory when agentManaged is false', async () => {
    const { tools, system } = await renderWorkingMemoryInstruction(false);

    expect(tools).not.toContain('updateWorkingMemory');
    expect(system.join('\n')).toContain('WORKING_MEMORY_SYSTEM_INSTRUCTION (READ-ONLY)');
    expect(system.join('\n')).not.toContain('updateWorkingMemory');
  });

  it('keeps the tool instruction when agentManaged is not false', async () => {
    const { tools, system } = await renderWorkingMemoryInstruction(undefined);

    expect(tools).toContain('updateWorkingMemory');
    expect(system.join('\n')).toContain('updateWorkingMemory');
  });
});
