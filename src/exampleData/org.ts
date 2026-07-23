import type { MindElixirData } from '../index'

// A deep, org-chart style dataset that fits the top-down (DOWN) layout well:
// narrow-ish width but multiple levels of hierarchy.
const orgChart: MindElixirData = {
  direction: 3,
  nodeData: {
    id: 'ceo',
    topic: 'CEO',
    children: [
      {
        id: 'cto',
        topic: 'CTO',
        children: [
          {
            id: 'vp-eng',
            topic: 'VP Engineering',
            children: [
              {
                id: 'fe-lead',
                topic: 'Frontend Lead',
                children: [
                  {
                    id: 'fe-senior',
                    topic: 'Senior Frontend',
                    children: [
                      { id: 'fe-eng', topic: 'Frontend Engineer' },
                      { id: 'fe-intern', topic: 'Frontend Intern' },
                    ],
                  },
                  { id: 'ui-eng', topic: 'UI Engineer' },
                ],
              },
              {
                id: 'be-lead',
                topic: 'Backend Lead',
                children: [
                  {
                    id: 'be-senior',
                    topic: 'Senior Backend',
                    children: [{ id: 'be-eng', topic: 'Backend Engineer' }],
                  },
                  { id: 'db-eng', topic: 'Database Engineer' },
                ],
              },
            ],
          },
          {
            id: 'vp-infra',
            topic: 'VP Infrastructure',
            children: [
              {
                id: 'devops-lead',
                topic: 'DevOps Lead',
                children: [{ id: 'sre', topic: 'SRE' }],
              },
              { id: 'sec-lead', topic: 'Security Lead' },
            ],
          },
        ],
      },
      {
        id: 'cfo',
        topic: 'CFO',
        children: [
          {
            id: 'fin-mgr',
            topic: 'Finance Manager',
            children: [{ id: 'accountant', topic: 'Accountant' }],
          },
          { id: 'proc-mgr', topic: 'Procurement Manager' },
        ],
      },
      {
        id: 'coo',
        topic: 'COO',
        children: [
          {
            id: 'ops-mgr',
            topic: 'Operations Manager',
            children: [
              {
                id: 'support-lead',
                topic: 'Support Lead',
                children: [{ id: 'support-agent', topic: 'Support Agent' }],
              },
            ],
          },
          {
            id: 'hr-mgr',
            topic: 'HR Manager',
            children: [{ id: 'recruiter', topic: 'Recruiter' }],
          },
        ],
      },
      {
        id: 'cmo',
        topic: 'CMO',
        children: [
          {
            id: 'mkt-mgr',
            topic: 'Marketing Manager',
            children: [{ id: 'content', topic: 'Content Specialist' }],
          },
          {
            id: 'sales-dir',
            topic: 'Sales Director',
            children: [{ id: 'ae', topic: 'Account Executive' }],
          },
        ],
      },
    ],
  },
}

export default orgChart
