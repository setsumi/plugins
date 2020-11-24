import { getVersion } from "../utils";
import { processData as ExchainMusic } from "../data/Exchain"
import { processData as MatixxMusic } from "../data/Matixx"
import { readXML } from "../data/helper";
import * as path from "path";

export const playableMusic: EPR = async (info, data, send) => {
  const version = getVersion(info);

  let musicList: any[] = [];
  try {
    if (U.GetConfig("enable_custom_mdb")) {
      const data = await readXML(path.normalize(U.GetConfig("custom_mdb_path")))
      const mdb = $(data).elements("mdb.mdb_data");

      for (const m of mdb) {
        const d = m.content("xg_diff_list");
        const contain = m.content("contain_stat");
        const gf = contain[0];
        const dm = contain[1];

        if (gf == 0 && dm == 0) {
          continue;
        }

        let type = gf;
        if (gf == 0) {
          type = dm;
        }

        musicList.push({
          id: K.ITEM('s32', m.number("music_id")),
          cont_gf: K.ITEM('bool', gf == 0 ? 0 : 1),
          cont_dm: K.ITEM('bool', dm == 0 ? 0 : 1),
          is_secret: K.ITEM('bool', 0),
          is_hot: K.ITEM('bool', type == 2 ? 0 : 1),
          data_ver: K.ITEM('s32', m.number("data_ver", 115)),
          diff: K.ARRAY('u16', [
            d[0],
            d[1],
            d[2],
            d[3],
            d[4],
            d[10],
            d[11],
            d[12],
            d[13],
            d[14],
            d[5],
            d[6],
            d[7],
            d[8],
            d[9],
          ]),
        });
      }
    }
  } catch (e) {
    console.log(e.stack);
    send.deny();
  }

  if (musicList.length == 0) {
    if (version == 'exchain') {
      musicList = _.get(await ExchainMusic(), 'music', []);
    } else {
      musicList = _.get(await MatixxMusic(), 'music', []);
    }
  }


  await send.object({
    hot: {
      major: K.ITEM('s32', 1),
      minor: K.ITEM('s32', 1),
    },
    musicinfo: {
      '@attr': {
        nr: musicList.length,
      },
      'music': musicList,
    },
  });
};