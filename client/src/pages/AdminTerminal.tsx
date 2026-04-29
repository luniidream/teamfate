import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Tab =
  | "members"
  | "shiny-types"
  | "shiny-methods"
  | "dex-research"
  | "bounties"
  | "events"
  | "settings";

export default function AdminTerminal() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: adminMe, isLoading: authLoading } = trpc.adminAuth.me.useQuery();

  const [tab, setTab] = useState<Tab>("members");

  const logoutMut = trpc.adminAuth.logout.useMutation({
    onSuccess: async () => {
      await utils.adminAuth.me.invalidate();
      setLocation("/");
    },
  });

  useEffect(() => {
    if (!authLoading && !adminMe?.authenticated) {
      setLocation("/admin-login");
    }
  }, [adminMe, authLoading, setLocation]);

  if (authLoading || !adminMe?.authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-400" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b" style={{ borderColor: "rgba(34, 197, 94, 0.3)" }}>
        <div className="container px-4 py-6 flex items-center justify-between flex-wrap gap-4">
          <h1
            className="text-2xl font-bold"
            style={{ color: "#22c55e", textShadow: "0 0 10px rgba(34, 197, 94, 0.8)" }}
          >
            Admin terminal
          </h1>
          <Button variant="destructive" className="gap-2" onClick={() => logoutMut.mutate()}>
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      <div className="container px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-teal-500/20 pb-4">
          {(
            [
              ["members", "Members"],
              ["shiny-types", "Shiny types"],
              ["shiny-methods", "Methods"],
              ["dex-research", "Dex research"],
              ["bounties", "Bounties"],
              ["events", "Events"],
              ["settings", "Site settings"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm ${
                tab === id ? "bg-teal-600 text-white" : "bg-gray-800 text-muted-foreground hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "members" && <MembersPanel />}
        {tab === "shiny-types" && <ShinyTypesPanel />}
        {tab === "shiny-methods" && <ShinyMethodsPanel />}
        {tab === "dex-research" && <DexResearchPanel />}
        {tab === "bounties" && <BountiesPanel />}
        {tab === "events" && <EventsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </div>
    </div>
  );
}

function MembersPanel() {
  const utils = trpc.useUtils();
  const { data: members = [], isLoading } = trpc.members.list.useQuery();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const createMut = trpc.members.create.useMutation({
    onSuccess: async (r) => {
      await utils.members.list.invalidate();
      toast.success(`Member created. Password: ${r.generatedPassword}`);
      setUsername("");
      setDisplayName("");
    },
    onError: (e) => toast.error(e.message),
  });
  const resetMut = trpc.members.resetPassword.useMutation({
    onSuccess: async (r) => {
      await utils.members.list.invalidate();
      toast.success(`New password: ${r.generatedPassword}`);
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.members.delete.useMutation({
    onSuccess: async () => {
      await utils.members.list.invalidate();
      toast.success("Member removed");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin text-teal-400" />;

  return (
    <div className="space-y-8">
      <div
        className="p-6 rounded-lg space-y-4 max-w-lg"
        style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}
      >
        <h2 className="text-lg font-bold text-teal-400">Add member</h2>
        <p className="text-xs text-muted-foreground">
          A random password is generated once; copy it from the toast and give it to the member. Use reset if they lose it.
        </p>
        <input
          placeholder="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-teal-500/30 rounded"
        />
        <input
          placeholder="display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 bg-background border border-teal-500/30 rounded"
        />
        <Button
          type="button"
          onClick={() => createMut.mutate({ username: username.trim(), displayName: displayName.trim() })}
          disabled={!username.trim() || !displayName.trim()}
          className="gap-2"
        >
          <Plus size={16} />
          Create
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-teal-500/20 text-teal-400 text-left">
              <th className="py-2 px-2">User</th>
              <th className="py-2 px-2">Display</th>
              <th className="py-2 px-2">Shinies</th>
              <th className="py-2 px-2">Points</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b border-teal-500/10">
                <td className="py-2 px-2">{m.username}</td>
                <td className="py-2 px-2">{m.displayName}</td>
                <td className="py-2 px-2">{m.shinyCount}</td>
                <td className="py-2 px-2">{m.shinyPoints}</td>
                <td className="py-2 px-2 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => resetMut.mutate({ id: m.id })}>
                    Reset password
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Delete ${m.username}?`)) delMut.mutate(m.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ShinyTypesPanel() {
  const utils = trpc.useUtils();
  const { data: types = [], isLoading } = trpc.shinyTypes.list.useQuery();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [emoji, setEmoji] = useState("");
  const createMut = trpc.shinyTypes.create.useMutation({
    onSuccess: async () => {
      await utils.shinyTypes.list.invalidate();
      toast.success("Type added");
      setName("");
      setCode("");
      setIconUrl("");
      setEmoji("");
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.shinyTypes.delete.useMutation({
    onSuccess: async () => {
      await utils.shinyTypes.list.invalidate();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg space-y-3 max-w-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <h2 className="font-bold text-teal-400">New shiny type</h2>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Name (e.g. Secret)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Code (e.g. secret)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Icon image URL" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Emoji (optional)" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <Button
          type="button"
          onClick={() => createMut.mutate({ name: name.trim(), code: code.trim().toLowerCase().replace(/\s+/g, "_"), iconUrl: iconUrl || undefined, emoji: emoji || undefined })}
          disabled={!name.trim() || !code.trim()}
        >
          Add type
        </Button>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {types.map((t) => (
          <li key={t.id} className="p-4 rounded border border-teal-500/20 flex justify-between gap-2 items-center">
            <div>
              <div className="font-bold text-teal-400">
                {t.emoji} {t.name}
              </div>
              <div className="text-xs text-muted-foreground">{t.code}</div>
              {t.iconUrl && (
                <img src={t.iconUrl} alt="" className="h-8 mt-2 object-contain" />
              )}
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => delMut.mutate(t.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShinyMethodsPanel() {
  const utils = trpc.useUtils();
  const { data: methods = [], isLoading } = trpc.shinyMethods.list.useQuery();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [emoji, setEmoji] = useState("");
  const createMut = trpc.shinyMethods.create.useMutation({
    onSuccess: async () => {
      await utils.shinyMethods.list.invalidate();
      toast.success("Method added");
      setName("");
      setCode("");
      setIconUrl("");
      setEmoji("");
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.shinyMethods.delete.useMutation({
    onSuccess: async () => {
      await utils.shinyMethods.list.invalidate();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg space-y-3 max-w-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <h2 className="font-bold text-teal-400">New hunt method</h2>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Name (e.g. Egg)" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Code (e.g. egg)" value={code} onChange={(e) => setCode(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Icon image URL" value={iconUrl} onChange={(e) => setIconUrl(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Emoji (optional)" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
        <Button
          type="button"
          onClick={() =>
            createMut.mutate({
              name: name.trim(),
              code: code.trim().toLowerCase().replace(/\s+/g, "_"),
              iconUrl: iconUrl || undefined,
              emoji: emoji || undefined,
            })
          }
          disabled={!name.trim() || !code.trim()}
        >
          Add method
        </Button>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {methods.map((m) => (
          <li key={m.id} className="p-4 rounded border border-teal-500/20 flex justify-between gap-2 items-center">
            <div>
              <div className="font-bold text-teal-400">
                {m.emoji} {m.name}
              </div>
              <div className="text-xs text-muted-foreground">{m.code}</div>
              {m.iconUrl && <img src={m.iconUrl} alt="" className="h-8 mt-2 object-contain" />}
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => delMut.mutate(m.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DexResearchPanel() {
  const utils = trpc.useUtils();
  const { data: targets = [], isLoading } = trpc.dexResearch.list.useQuery();
  const { data: types = [] } = trpc.shinyTypes.list.useQuery();
  const { data: methods = [] } = trpc.shinyMethods.list.useQuery();
  const [pokemonId, setPokemonId] = useState("");
  const [pokemonName, setPokemonName] = useState("");
  const [typeId, setTypeId] = useState("");
  const [methodId, setMethodId] = useState("");
  const [notes, setNotes] = useState("");

  const createMut = trpc.dexResearch.create.useMutation({
    onSuccess: async () => {
      await utils.dexResearch.list.invalidate();
      toast.success("Research target added");
      setPokemonId("");
      setPokemonName("");
      setTypeId("");
      setMethodId("");
      setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.dexResearch.delete.useMutation({
    onSuccess: async () => {
      await utils.dexResearch.list.invalidate();
      toast.success("Removed");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg space-y-3 max-w-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <h2 className="font-bold text-teal-400">Add dex research target</h2>
        <p className="text-xs text-muted-foreground">Highlights species on the Shiny Dex (optional type / method focus).</p>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Pokédex #" value={pokemonId} onChange={(e) => setPokemonId(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Name (optional)" value={pokemonName} onChange={(e) => setPokemonName(e.target.value)} />
        <select className="w-full px-3 py-2 bg-background border rounded" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
          <option value="">Any shiny type</option>
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <select className="w-full px-3 py-2 bg-background border rounded" value={methodId} onChange={(e) => setMethodId(e.target.value)}>
          <option value="">Any method</option>
          {methods.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button
          type="button"
          onClick={() => {
            const id = parseInt(pokemonId, 10);
            if (!Number.isFinite(id)) {
              toast.error("Invalid Pokémon ID");
              return;
            }
            createMut.mutate({
              pokemonId: id,
              pokemonName: pokemonName.trim() || undefined,
              shinyTypeId: typeId ? parseInt(typeId, 10) : null,
              shinyMethodId: methodId ? parseInt(methodId, 10) : null,
              notes: notes.trim() || undefined,
            });
          }}
        >
          Add target
        </Button>
      </div>
      <ul className="space-y-2">
        {targets.map((t) => (
          <li key={t.id} className="flex justify-between items-center p-3 rounded border border-teal-500/20">
            <div>
              <span className="font-mono text-pink-400">#{t.pokemonId}</span> {t.pokemonName ?? ""}
              <div className="text-xs text-muted-foreground">
                {[t.shinyTypeName, t.shinyMethodName].filter(Boolean).join(" · ") || "Any"}
                {t.notes ? ` — ${t.notes}` : ""}
              </div>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => delMut.mutate(t.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BountiesPanel() {
  const utils = trpc.useUtils();
  const { data: list = [], isLoading } = trpc.bounties.list.useQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [points, setPoints] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const createMut = trpc.bounties.create.useMutation({
    onSuccess: async () => {
      await utils.bounties.list.invalidate();
      await utils.bounties.getActive.invalidate();
      toast.success("Bounty created");
      setTitle("");
      setDescription("");
      setPoints("");
      setImageUrl("");
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.bounties.delete.useMutation({
    onSuccess: async () => {
      await utils.bounties.list.invalidate();
      await utils.bounties.getActive.invalidate();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg space-y-3 max-w-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <h2 className="font-bold text-teal-400">New bounty</h2>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full px-3 py-2 bg-background border rounded" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        <Button
          type="button"
          onClick={() =>
            createMut.mutate({
              title: title || undefined,
              description: description || undefined,
              month,
              points: points ? parseInt(points, 10) : undefined,
              imageUrl: imageUrl || undefined,
            })
          }
          disabled={!month}
        >
          Create
        </Button>
      </div>
      <ul className="space-y-3">
        {list.map((b) => (
          <li key={b.id} className="p-4 rounded border border-teal-500/20 flex justify-between gap-4">
            <div>
              <div className="font-bold">{b.title}</div>
              <div className="text-sm text-muted-foreground">{b.description}</div>
              <div className="text-xs mt-1">{b.month} · {b.points ?? 0} pts · {b.isActive ? "active" : "off"}</div>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => delMut.mutate(b.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EventsPanel() {
  const utils = trpc.useUtils();
  const { data: list = [], isLoading } = trpc.events.list.useQuery();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const createMut = trpc.events.create.useMutation({
    onSuccess: async () => {
      await utils.events.list.invalidate();
      await utils.events.getNext.invalidate();
      toast.success("Event saved");
      setTitle("");
      setDescription("");
      setEventDate("");
      setExternalUrl("");
    },
    onError: (e) => toast.error(e.message),
  });
  const delMut = trpc.events.delete.useMutation({
    onSuccess: async () => {
      await utils.events.list.invalidate();
      await utils.events.getNext.invalidate();
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Loader2 className="animate-spin" />;

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-lg space-y-3 max-w-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
        <h2 className="font-bold text-teal-400">New event</h2>
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full px-3 py-2 bg-background border rounded" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <input className="w-full px-3 py-2 bg-background border rounded" placeholder="External URL" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
        <Button
          type="button"
          onClick={() => createMut.mutate({ title: title.trim(), description: description || undefined, eventDate: eventDate || undefined, externalUrl: externalUrl || undefined })}
          disabled={!title.trim()}
        >
          Save event
        </Button>
      </div>
      <ul className="space-y-2">
        {list.map((ev) => (
          <li key={ev.id} className="flex justify-between p-3 rounded border border-teal-500/20">
            <div>
              <div className="font-bold">{ev.title}</div>
              <div className="text-xs text-muted-foreground">{ev.description}</div>
            </div>
            <Button type="button" size="sm" variant="destructive" onClick={() => delMut.mutate(ev.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SettingsPanel() {
  const utils = trpc.useUtils();
  const { data: s, isLoading } = trpc.siteSettings.get.useQuery();
  const [logoUrl, setLogoUrl] = useState("");
  const [navHomeLabel, setNavHomeLabel] = useState("");
  const [navTeamInfoLabel, setNavTeamInfoLabel] = useState("");
  const [navShowcaseLabel, setNavShowcaseLabel] = useState("");
  const [navDexLabel, setNavDexLabel] = useState("");
  const [navRecruitmentLabel, setNavRecruitmentLabel] = useState("");
  const [teamInfoTitle, setTeamInfoTitle] = useState("");
  const [teamInfoDescription, setTeamInfoDescription] = useState("");
  const [teamInfoButtonLabel, setTeamInfoButtonLabel] = useState("");
  const [recruitmentTitle, setRecruitmentTitle] = useState("");
  const [recruitmentRequirements, setRecruitmentRequirements] = useState("");
  const [recruitmentPerks, setRecruitmentPerks] = useState("");
  const [recruitmentDiscordLabel, setRecruitmentDiscordLabel] = useState("");
  const [recruitmentDiscordUrl, setRecruitmentDiscordUrl] = useState("");
  const [recruitmentOpen, setRecruitmentOpen] = useState(true);

  useEffect(() => {
    if (!s) return;
    setLogoUrl(s.logoUrl ?? "");
    setNavHomeLabel(s.navHomeLabel);
    setNavTeamInfoLabel(s.navTeamInfoLabel);
    setNavShowcaseLabel(s.navShowcaseLabel);
    setNavDexLabel(s.navDexLabel);
    setNavRecruitmentLabel(s.navRecruitmentLabel);
    setTeamInfoTitle(s.teamInfoTitle);
    setTeamInfoDescription(s.teamInfoDescription ?? "");
    setTeamInfoButtonLabel(s.teamInfoButtonLabel);
    setRecruitmentTitle(s.recruitmentTitle);
    setRecruitmentRequirements(s.recruitmentRequirements ?? "");
    setRecruitmentPerks(s.recruitmentPerks ?? "");
    setRecruitmentDiscordLabel(s.recruitmentDiscordLabel);
    setRecruitmentDiscordUrl(s.recruitmentDiscordUrl ?? "");
    setRecruitmentOpen(s.recruitmentOpen);
  }, [s]);

  const saveMut = trpc.siteSettings.update.useMutation({
    onSuccess: async () => {
      await utils.siteSettings.get.invalidate();
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading || !s) return <Loader2 className="animate-spin" />;

  return (
    <div className="max-w-2xl space-y-4 p-6 rounded-lg" style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(34,197,94,0.3)" }}>
      {[
        ["Logo URL", logoUrl, setLogoUrl],
        ["Nav: Home", navHomeLabel, setNavHomeLabel],
        ["Nav: Team info", navTeamInfoLabel, setNavTeamInfoLabel],
        ["Nav: Showcase", navShowcaseLabel, setNavShowcaseLabel],
        ["Nav: Dex", navDexLabel, setNavDexLabel],
        ["Nav: Recruitment", navRecruitmentLabel, setNavRecruitmentLabel],
        ["Team page title", teamInfoTitle, setTeamInfoTitle],
        ["Team info button label", teamInfoButtonLabel, setTeamInfoButtonLabel],
        ["Recruitment title", recruitmentTitle, setRecruitmentTitle],
        ["Discord button label", recruitmentDiscordLabel, setRecruitmentDiscordLabel],
        ["Discord URL", recruitmentDiscordUrl, setRecruitmentDiscordUrl],
      ].map(([label, val, set]) => (
        <label key={label as string} className="block">
          <span className="text-xs text-teal-400 font-bold">{label as string}</span>
          <input className="w-full mt-1 px-3 py-2 bg-background border rounded" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} />
        </label>
      ))}
      <label className="block">
        <span className="text-xs text-teal-400 font-bold">Team description (Team info page)</span>
        <textarea className="w-full mt-1 px-3 py-2 bg-background border rounded min-h-[100px]" value={teamInfoDescription} onChange={(e) => setTeamInfoDescription(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-teal-400 font-bold">Recruitment requirements</span>
        <textarea className="w-full mt-1 px-3 py-2 bg-background border rounded min-h-[80px]" value={recruitmentRequirements} onChange={(e) => setRecruitmentRequirements(e.target.value)} />
      </label>
      <label className="block">
        <span className="text-xs text-teal-400 font-bold">Recruitment perks (one line per perk)</span>
        <textarea className="w-full mt-1 px-3 py-2 bg-background border rounded min-h-[100px]" value={recruitmentPerks} onChange={(e) => setRecruitmentPerks(e.target.value)} placeholder={"Line 1\nLine 2"} />
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={recruitmentOpen} onChange={(e) => setRecruitmentOpen(e.target.checked)} />
        <span className="text-sm">Recruitment open</span>
      </label>
      <Button
        type="button"
        onClick={() =>
          saveMut.mutate({
            logoUrl: logoUrl || undefined,
            navHomeLabel: navHomeLabel || undefined,
            navTeamInfoLabel: navTeamInfoLabel || undefined,
            navShowcaseLabel: navShowcaseLabel || undefined,
            navDexLabel: navDexLabel || undefined,
            navRecruitmentLabel: navRecruitmentLabel || undefined,
            teamInfoTitle: teamInfoTitle || undefined,
            teamInfoDescription: teamInfoDescription || undefined,
            teamInfoButtonLabel: teamInfoButtonLabel || undefined,
            recruitmentTitle: recruitmentTitle || undefined,
            recruitmentRequirements: recruitmentRequirements || undefined,
            recruitmentPerks: recruitmentPerks || null,
            recruitmentDiscordLabel: recruitmentDiscordLabel || undefined,
            recruitmentDiscordUrl: recruitmentDiscordUrl || undefined,
            recruitmentOpen,
          })
        }
      >
        Save settings
      </Button>
    </div>
  );
}
