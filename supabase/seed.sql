insert into models (name, slug, provider, cost_input, cost_output, elo, active) values
  ('Claude Haiku 3.5', 'anthropic/claude-3.5-haiku', 'Anthropic', 0.8, 4, 1000, true),
  ('GPT-4o mini', 'openai/gpt-4o-mini', 'OpenAI', 0.15, 0.6, 1000, true),
  ('Llama 3.1 8B', 'meta-llama/llama-3.1-8b-instruct', 'Meta', 0.06, 0.06, 1000, true),
  ('Mistral 7B', 'mistralai/mistral-7b-instruct', 'Mistral', 0.06, 0.06, 1000, true),
  ('Qwen 2.5 7B', 'qwen/qwen-2.5-7b-instruct', 'Qwen', 0.04, 0.1, 1000, true)
on conflict (slug) do nothing;

insert into prompts (content, domain, source, approved) values
  (
    'Explain why static AI benchmarks get contaminated over time. Keep it under 150 words.',
    'writing',
    'seed',
    true
  ),
  (
    'Write a short product pitch for a platform where AI models battle head to head.',
    'writing',
    'seed',
    true
  ),
  (
    'A developer asks which model to pick for a startup with a tight API budget. Give practical advice.',
    'writing',
    'seed',
    true
  );
