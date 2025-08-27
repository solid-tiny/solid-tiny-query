import { type ComponentProps, createMemo, splitProps } from 'solid-js';

export function Button(props: ComponentProps<'button'>) {
  const [localProps, others] = splitProps(props, [
    'class',
    'children',
    'type',
    'disabled',
  ]);

  const classes = createMemo(() => {
    const classList = [
      'rounded',
      'bg-blue-600',
      'px-4',
      'py-2',
      'text-white',
      'transition-colors',
      'hover:bg-blue-700',
    ];
    if (localProps.class) {
      classList.push(localProps.class);
    }
    if (localProps.disabled) {
      classList.push('opacity-50', 'pointer-events-none');
    }
    return classList.join(' ');
  });
  return (
    <button
      class={classes()}
      disabled={localProps.disabled}
      type={localProps.type ?? 'button'}
      {...others}
    >
      {localProps.children}
    </button>
  );
}
