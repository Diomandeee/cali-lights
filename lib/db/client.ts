import { sql as vercelSql } from "@vercel/postgres";
import { Client } from "pg";

// Check if we have a direct connection string (non-pooled)
const postgresUrl = process.env.POSTGRES_URL || "";
const isDirectConnection = postgresUrl && !postgresUrl.includes("pooler") && !postgresUrl.includes("pooled");

let pgClient: Client | null = null;
let pgClientPromise: Promise<Client> | null = null;

async function getPgClient(): Promise<Client> {
  if (pgClient) {
    try {
      // Check if client is still connected by trying a simple query
      await pgClient.query("SELECT 1");
      return pgClient;
    } catch {
      // Client is disconnected, reset it
      pgClient = null;
      pgClientPromise = null;
    }
  }
  
  if (pgClientPromise) {
    return pgClientPromise;
  }
  
  pgClientPromise = (async () => {
    const client = new Client({ connectionString: postgresUrl });
    await client.connect();
    pgClient = client;
    return client;
  })();
  
  return pgClientPromise;
}

// Helper to create SQL fragment from template literal (without executing)
function createSqlFragment(strings: TemplateStringsArray, values: any[]): { query: string; params: any[] } {
  let query = strings[0];
  const params: any[] = [];
  
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    // Handle SQL fragments (from sql.join, sql.raw, or nested sql``)
    if (value && typeof value === 'object' && 'query' in value && 'params' in value) {
      const fragment = value as { query: string; params: any[] };
      const paramOffset = params.length;
      const adjustedQuery = fragment.query.replace(/\$(\d+)/g, (_, num) => {
        return `$${parseInt(num) + paramOffset}`;
      });
      query += adjustedQuery;
      params.push(...fragment.params);
    } else {
      params.push(value);
      query += `$${params.length}`;
    }
    query += strings[i + 1];
  }
  
  return { query, params };
}

// Create a sql function that works with both pooled and direct connections
const sqlImpl = isDirectConnection
  ? ((strings: TemplateStringsArray, ...values: any[]) => {
      const fragment = createSqlFragment(strings, values);

      const execute = async () => {
        try {
          const client = await getPgClient();
          const result = await client.query(fragment.query, fragment.params);
          return { rows: result.rows };
        } catch (error: any) {
          console.error("SQL Error:", {
            query: fragment.query,
            params: fragment.params,
            error: error?.message,
          });
          throw error;
        }
      };

      const thenable: any = {
        query: fragment.query,
        params: fragment.params,
        then(onFulfilled: any, onRejected?: any) {
          return execute().then(onFulfilled, onRejected);
        },
        catch(onRejected: any) {
          return execute().catch(onRejected);
        },
        finally(onFinally: any) {
          return execute().finally(onFinally);
        },
      };
      thenable[Symbol.toStringTag] = "Promise";

      return thenable;
    }) as typeof vercelSql
  : vercelSql;

// Add join method to sql function
(sqlImpl as any).join = (fragments: any[], separator: any) => {
  if (isDirectConnection) {
    // Handle empty fragments - return a fragment that evaluates to false in SQL
    if (!fragments || fragments.length === 0) {
      return { query: "(SELECT NULL WHERE FALSE)", params: [] };
    }
    
    // Filter out any null/undefined fragments and extract valid ones
    const validFragments: Array<{ query: string; params: any[] } | string> = [];
    for (const fragment of fragments) {
      if (fragment == null) continue;
      
      if (fragment && typeof fragment === 'object' && 'query' in fragment) {
        const frag = fragment as { query: string; params: any[] };
        if (frag.query && frag.query.trim() !== '') {
          validFragments.push(frag);
        }
      } else {
        validFragments.push(String(fragment));
      }
    }
    
    if (validFragments.length === 0) {
      return { query: "(SELECT NULL WHERE FALSE)", params: [] };
    }
    
    // Combine SQL fragments with separator
    const parts: string[] = [];
    const allParams: any[] = [];
    
    // Handle separator - if it's a SQL fragment, extract the query string
    let sepString = "";
    if (separator && typeof separator === 'object' && 'query' in separator) {
      const sep = separator as { query: string; params: any[] };
      // Don't trim - preserve spaces in separator (e.g., " AND ", ", ")
      sepString = sep.query;
      // If separator has params, adjust them (though separators typically don't have params)
      if (sep.params && sep.params.length > 0) {
        const paramOffset = allParams.length;
        sepString = sep.query.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + paramOffset}`);
        allParams.push(...sep.params);
      }
    } else if (separator != null) {
      // Don't trim - preserve spaces in separator
      sepString = String(separator);
    }
    
    // Ensure separator is not empty if we have multiple fragments
    if (validFragments.length > 1 && !sepString) {
      sepString = ", "; // Default separator
    }
    
    validFragments.forEach((fragment, index) => {
      // Add separator between fragments (not before first)
      if (index > 0 && sepString) {
        parts.push(sepString);
      }
      
      if (typeof fragment === 'string') {
        parts.push(fragment);
      } else {
        const frag = fragment as { query: string; params: any[] };
        const paramOffset = allParams.length;
        const adjustedQuery = frag.query.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + paramOffset}`);
        parts.push(adjustedQuery);
        allParams.push(...(frag.params || []));
      }
    });
    
    const joinedQuery = parts.join('');
    
    // Safety check: ensure we don't produce invalid SQL
    if (!joinedQuery || joinedQuery.trim() === '' || joinedQuery.trim() === sepString.trim()) {
      return { query: "(SELECT NULL WHERE FALSE)", params: [] };
    }
    
    return { query: joinedQuery, params: allParams };
  } else {
    // Use Vercel's sql.join
    return (vercelSql as any).join(fragments, separator);
  }
};

// Add raw method for raw SQL strings
(sqlImpl as any).raw = (str: string) => {
  return { query: str, params: [] };
};

export const sql = sqlImpl as typeof vercelSql & { 
  join: (fragments: any[], separator: any) => any;
  raw: (str: string) => { query: string; params: any[] };
};
